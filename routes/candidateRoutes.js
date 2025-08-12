const express = require('express');
const router = express.Router();

const User = require('../models/user');
const {jwtAuthMiddleware} = require('../jwt');
const Candidate = require('../models/candidate');

const checkAdminRole = async (userID) => {
   try{
        const user = await User.findById(userID);
        if(user && user.role === 'admin'){
            return true;
        }
        return false;
   }
   catch(err){
        return false;
   }
}

// POST route to add a candidate
router.post('/', jwtAuthMiddleware, async (req, res) =>{
    try{
        if(!(await checkAdminRole(req.user.id)))
            return res.status(403).json({message: 'User does not have admin role'});

        const data = req.body;
        const newCandidate = new Candidate(data);
        const response = await newCandidate.save();
        console.log('Data saved for new candidate');
        res.status(200).json({response: response});
    }
    catch(err){
        console.error("Error in POST candidate:", err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

// VOTE COUNT - Specific route must come before any general /:id routes
router.get('/vote/count', async (req, res) => {
    try{
        // Find all candidates and sort by voteCount
        const candidates = await Candidate.find().sort({voteCount: -1});

        // Map to a cleaner format
        const voteRecord = candidates.map((data)=>{
            return {
                party: data.party,
                count: data.voteCount
            }
        });

        return res.status(200).json(voteRecord);
    }
    catch(err){
        console.error("Error in GET /vote/count:", err);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

// let's start voting
router.get('/vote/:candidateID', jwtAuthMiddleware, async (req, res)=>{     // in url use the candidate id you want to vote and in token provide the voter's token
    // no admin can vote
    // user can only vote once
    
    candidateID = req.params.candidateID;
    userId = req.user.id;

    try{
        // Find the Candidate document with the specified candidateID
        const candidate = await Candidate.findById(candidateID);
        if(!candidate){
            return res.status(404).json({ message: 'Candidate not found' });
        }

        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({ message: 'user not found' });
        }
        if(user.role == 'admin'){
            return res.status(403).json({ message: 'admin is not allowed'});
        }
        if(user.isVoted){
            return res.status(400).json({ message: 'You have already voted' });
        }

        // Update the Candidate document to record the vote
        candidate.votes.push({user: userId})
        candidate.voteCount++;
        await candidate.save();

        // update the user document
        user.isVoted = true
        await user.save();

        return res.status(200).json({ message: 'Vote recorded successfully' });
    }
    catch(err){
        console.log(err);
        return res.status(500).json({error: 'Internal Server Error'});
    }
});



// UPDATE a candidate by ID
router.put('/:candidateID', jwtAuthMiddleware, async (req, res)=>{
    try{
        if(!(await checkAdminRole(req.user.id)))
            return res.status(403).json({message: 'User does not have admin role'});
        
        const candidateID = req.params.candidateID;
        const updatedCandidateData = req.body;

        const response = await Candidate.findByIdAndUpdate(candidateID, updatedCandidateData, {
            new: true,
            runValidators: true,
        })

        if (!response) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        console.log('Candidate data updated');
        res.status(200).json(response);
    }
    catch(err){
        console.error("Error in PUT /:candidateID:", err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

// DELETE a candidate by ID
router.delete('/:candidateID', jwtAuthMiddleware, async (req, res)=>{
    try{
        if(!(await checkAdminRole(req.user.id)))
            return res.status(403).json({message: 'User does not have admin role'});
        
        const candidateID = req.params.candidateID;
        const response = await Candidate.findByIdAndDelete(candidateID);

        if (!response) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        console.log('Candidate deleted');
        res.status(200).json({response: response});
    }
    catch(err){
        console.error("Error in DELETE /:candidateID:", err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

module.exports = router;