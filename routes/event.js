const express = require('express');
const { Event } = require('../models/event');
const { User } = require('../models/user');
const router = express.Router();
const mongoose = require('mongoose');
const cloudinary = require('../utils/cloudinary');
const uploadOptions = require('../utils/multer');
const streamifier = require('streamifier');


// Get All Mobile Events
router.get(`/`, async (req, res) => {
    const { type } = req.query;

    try {
        let events;

        if (type) {
            events = await Event.find({ type: type });
        } else {
            events = await Event.find();
        }
        if (events.length === 0) {
            return res.status(200).send('no events found');
        }

        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET all web events
router.get('/events', async (req, res) => {
    try {
      const events = await Event.find().sort({ dateStart: -1 });
      res.status(200).json({
        success: true,
        count: events.length,
        data: events
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
});

// Create Web Events
router.post(`/create`, uploadOptions.array('images', 10), async (req, res) => {
    console.log('Register Request Body:', req.body);
  
    // Check if files are included in the request
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).send('No images uploaded in the request');
    }
  
    try {
      // Upload images to Cloudinary and get the URLs
      const uploadPromises = files.map(file => {
        return new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { resource_type: 'image' },
            (error, result) => {
              if (error) {
                reject(error);  // Reject if there's an error
              } else {
                resolve(result.secure_url);  // Resolve with the image URL
              }
            }
          ).end(file.buffer);  // Ensure to call .end() to initiate the upload
        });
      });
  
      // Wait for all images to upload and get their URLs
      const imageUrls = await Promise.all(uploadPromises);
  
      // Continue with saving event
      const event = new Event({
        name: req.body.name,
        description: req.body.description,
        type: req.body.type,
        organization: req.body.organization,
        department: req.body.department,
        dateStart: req.body.dateStart,
        dateEnd: req.body.dateEnd,
        location: req.body.location,
        images: imageUrls,  // Store the image URLs
        userId: req.body.userId,
      });
  
      const savedEvent = await event.save();
      if (!savedEvent) {
        return res.status(500).send('The event cannot be created');
      }
  
      res.send(savedEvent);
  
    } catch (error) {
      console.error('Error processing the event:', error);
      res.status(500).send('Error processing the event: ' + error.message);
    }
  });

// Update Web Event
router.put('/:id', uploadOptions.array('images', 10), async (req, res) => {
    console.log('Update Request Body:', req.body);    
  
    const event = await Event.findById(req.params.id);
    console.log("Event found:", event._id);
    if (!event) return res.status(400).send('Invalid Event!');
  
    const files = req.files;
    const existingImages = Array.isArray(req.body.existingImages) 
        ? req.body.existingImages 
        : (req.body.existingImages ? [req.body.existingImages] : []);
  
    try {
      let images = [...existingImages];
  
      if (files && files.length > 0) {
        // Upload new images to Cloudinary and get the URLs
        const imagePromises = files.map((file) => {
          return new Promise((resolve, reject) => {
            let cld_upload_stream = cloudinary.uploader.upload_stream(
              { folder: 'events' },
              (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
              }
            );

            streamifier.createReadStream(file.buffer).pipe(cld_upload_stream);
          });
        });
  
        const newImages = await Promise.all(imagePromises);
        images = [...images, ...newImages];
      }
  
      const updatedEvent = await Event.findByIdAndUpdate(
        req.params.id,
        {
          name: req.body.name,
          description: req.body.description,
          type: req.body.type,
          dateStart: req.body.dateStart,
          dateEnd: req.body.dateEnd,
          location: req.body.location,
          images: images,  // Save both existing and new Cloudinary URLs
          userId: req.body.userId,
        },
        { new: true }
      );
  
      if (!updatedEvent) return res.status(400).send('The event cannot be updated!');
  
      res.json({
        message: 'Event updated successfully',
        updatedEvent,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Error updating event: ' + error.message);
    }
});
  
// Get Admin's Events
router.get('/adminevents', async (req, res) => {
    try {
        const adminUsers = await User.find({ isAdmin: true });
        const adminIds = adminUsers.map(admin => admin._id);

        const events = await Event.find({ userId: { $in: adminIds } });
        res.status(200).send(events);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// router.put('/:id', uploadOptions.array('images', 10), async (req, res) => {
//     console.log(req.body);
//     if (!mongoose.isValidObjectId(req.params.id)) {
//         return res.status(400).send('Invalid Brand Id');
//     }

//     const brand = await Brand.findById(req.params.id);
//     if (!brand) return res.status(400).send('Invalid Product!');

//     let images = brand.images; // Existing images

//     const files = req.files;
//     if (files && files.length > 0) {
//         // If new images are uploaded, add them to the existing images array
//         const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;
//         const newImages = files.map(file => `${basePath}${file.filename}`);
//         images = images.concat(newImages);
//     }

//     const updatedBrand = await Brand.findByIdAndUpdate(
//         req.params.id,
//         {
//             name: req.body.name,
//             description: req.body.description,
//             images: images // Update images with the combined array of existing and new images
//         },
//         { new: true }
//     );

//     if (!updatedBrand) return res.status(500).send('the brand cannot be updated!');

//     res.send(updatedBrand);
// });

//Event Update
// router.put('/:id', async (req, res) => {
//     if (!mongoose.isValidObjectId(req.params.id)) {
//         return res.status(400).send('Invalid Event ID');
//     }

//     try {
//         const updatedEvent = await Event.findByIdAndUpdate(
//             req.params.id,
//             {
//                 name: req.body.name,
//                 description: req.body.description,
//                 dateStart: req.body.dateStart,
//                 dateEnd: req.body.dateEnd,
//                 images: req.body.images
//             },
//             { new: true }
//         );

//         if (!updatedEvent) {
//             return res.status(404).json({ success: false, message: 'Event not found' });
//         }

//         res.status(200).json(updatedEvent);
//     } catch (error) {
//         res.status(500).json({ success: false, error: error.message });
//     }
// });



// Delete Event
router.delete('/:id', (req, res)=>{
    Event.findByIdAndRemove(req.params.id).then(event =>{
        if(event) {
            return res.status(200).json({success: true, message: 'the event is deleted!'})
        } else {
            return res.status(404).json({success: false , message: "event not found!"})
        }
    }).catch(err=>{
       return res.status(500).json({success: false, error: err}) 
    })
})


// Event create feedback (di ata to ginamit)
router.post('/:id/feedback', async (req, res) => {
    const eventId = req.params.id;

    if (!mongoose.isValidObjectId(eventId)) {
        return res.status(400).send('Invalid Event ID');
    }
    const event = await Event.findById(eventId);
    if (!event) {
        return res.status(404).send('Event not found');
    }
    const feedback = {
        user: req.body.user,
        comment: req.body.comment
    };

    event.feedback.push(feedback);

    try {
        const updatedEvent = await event.save();
        res.status(200).json(updatedEvent);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create Feedback (di ata to ginamit)
router.post('/feedback', async (req, res) => {
    try {
        const { userId, eventName, feedback, rating } = req.body;
        const newRating = new Rating({ userId, eventName, feedback, rating});
        const savedRating = await newRating.save();
        res.status(201).json(savedRating, { message: "Feedback submitted successfully!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
}); 

// (di to ginamit)
// router.put('/gallery-images/:id', uploadOptions.array('images', 10), async (req, res) => {
//     if (!mongoose.isValidObjectId(req.params.id)) {
//         return res.status(400).send('Invalid Product Id');
//     }
//     const files = req.files;
//     let imagesPaths = [];
//     const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`;

//     if (files) {
//         files.map((file) => {
//             imagesPaths.push(`${basePath}${file.filename}`);
//         });
//     }

//     const brand = await Brand.findByIdAndUpdate(
//         req.params.id,
//         {
//             images: imagesPaths
//         },
//         { new: true }
//     );
        
//     if (!brand) return res.status(500).send('the gallery cannot be updated!');

//     res.send(brand);
// });

// Open or Close Event's Questionnaire
router.put('/toggle-feedback-survey/:eventId', async (req, res) => {
    try {
      const eventId = req.params.eventId;
  
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
  
      event.isFeedbackSurveyOpen = !event.isFeedbackSurveyOpen;
  
      await event.save();
      res.status(200).json({ message: 'Feedback & survey status updated', event });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });

// Get Specific Event (di ata to ginamit)
router.get('/:eventId', async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.json(event);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all calendar events
router.get('/event/events', async (req, res) => {
    try {
      const events = await Event.find({}, 'name dateStart dateEnd'); // Fetch event name and dates
      res.json(events);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

// Comment on
router.post('/:eventId/comments', async (req, res) => {
    const { text } = req.body;
    const userId = req.body.userId; // Assuming you pass the user ID in the request body

    if (!mongoose.isValidObjectId(req.params.eventId) || !mongoose.isValidObjectId(userId)) {
        return res.status(400).send('Invalid Event or User ID');
    }

    try {
        const event = await Event.findById(req.params.eventId);
        if (!event) {
            return res.status(404).send('Event not found');
        }

        event.comments.push({ user: userId, text });
        await event.save();

        res.status(201).json({ message: 'Comment added successfully', comments: event.comments });
    } catch (error) {
        res.status(500).json({ error: 'Error posting comment', details: error.message });
    }
});

// Kunin ang comments
router.get('/:eventId/comments', async (req, res) => {
    try {
        const event = await Event.findById(req.params.eventId).populate('comments.user', 'name'); // Populate user names
        if (!event) return res.status(404).send('Event not found');
        res.json(event.comments);
    } catch (error) {
        res.status(500).json({ error: 'Error retrieving comments', details: error.message });
    }
});

module.exports=router;