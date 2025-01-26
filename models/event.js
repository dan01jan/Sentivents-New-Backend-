const mongoose = require('mongoose');

// Comment schema as before
const commentSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Event schema
const eventSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    // Connect event type to the Type model via ObjectId reference
    type: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Type', // Reference to the Type model
        required: true
    },
    organization: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    dateStart: {
        type: Date,
        required: true
    },
    dateEnd: {
        type: Date,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    images: [{
        type: String
    }],
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    hasQuestionnaire: { 
        type: Boolean, 
        default: false 
    },
    comments: [commentSchema]
});

// Export the Event model
exports.Event = mongoose.model('Event', eventSchema);
