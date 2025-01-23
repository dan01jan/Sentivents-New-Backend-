const mongoose = require('mongoose');

const questionSchema = mongoose.Schema({
    question: { 
        type: String, 
        required: true 
    },
    scale: { 
        type: [Number], 
        required: true 
    },
    traitId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trait',
        required: true
    },
}); 

exports.Question = mongoose.model('Question', questionSchema);
