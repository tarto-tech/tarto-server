const mongoose = require('mongoose');
const Airport = require('../models/Airport');
require('dotenv').config();

const airports = [
  {
    name: "Kempegowda International Airport",
    code: "BLR",
    city: "Bangalore"
  },
  {
    name: "Chhatrapati Shivaji Maharaj International Airport",
    code: "BOM",
    city: "Mumbai"
  },
  {
    name: "Indira Gandhi International Airport",
    code: "DEL",
    city: "Delhi"
  },
  {
    name: "Chennai International Airport",
    code: "MAA",
    city: "Chennai"
  },
  {
    name: "Netaji Subhas Chandra Bose International Airport",
    code: "CCU",
    city: "Kolkata"
  },
  {
    name: "Rajiv Gandhi International Airport",
    code: "HYD",
    city: "Hyderabad"
  }
];

async function seedAirports() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Clear existing airports
    await Airport.deleteMany({});
    console.log('Cleared existing airports');
    
    // Insert new airports
    await Airport.insertMany(airports);
    console.log('Airports seeded successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding airports:', error);
    process.exit(1);
  }
}

seedAirports();