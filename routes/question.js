const express = require('express');
const router = express.Router();
const { Question } = require('../models/question');
const { Trait } = require('../models/trait');

// Fetch Questions
router.get('/', async (req, res) => {
  try {
    const questions = await Question.find().populate('traitId', 'trait');
    res.status(200).send(questions);
  } catch (error) {
    res.status(500).send('Error fetching questions: ' + error.message);
  }
});

// Fetch Questions for Creating Questionnaire
router.get('/questions-with-traits', async (req, res) => {
  try {
      const questions = await Question.find().populate('traitId', 'trait');
      res.status(200).json(questions);
  } catch (error) {
      res.status(500).json({ message: 'Error fetching questions', error });
  }
});

// Create Question
router.post('/create-question', async (req, res) => {
  try {
    const { question, scale, traitId } = req.body;

    if (!question || !scale || !traitId) {
      return res.status(400).send('All fields are required');
    }

    const newQuestion = new Question({ question, scale, traitId });
    await newQuestion.save();
    res.status(201).send(newQuestion);
  } catch (error) {
    res.status(500).send('Error creating question: ' + error.message);
  }
});

// Update Question
router.put('/:id', async (req, res) => {
  try {
    const { question, scale, traitId } = req.body;
    const updatedQuestion = await Question.findByIdAndUpdate(
      req.params.id,
      { question, scale, traitId },
      { new: true }
    );
    if (!updatedQuestion) return res.status(404).send('Question not found.');
    res.send(updatedQuestion);
  } catch (error) {
    res.status(500).send('Error updating question');
  }
});

// Delete Question
router.delete('/:id', async (req, res) => {
  try {
    const deletedQuestion = await Question.findByIdAndDelete(req.params.id);
    if (!deletedQuestion) return res.status(404).send('Question not found.');
    res.send('Question deleted successfully!');
  } catch (error) {
    res.status(500).send('Error deleting question');
  }
});

module.exports = router;
