import Note from "../models/Note.js";

export async function getAllNotes(req, res) {
    try {
        const notes = await Note.find()
        res.status(200).json(notes);
    } catch (err) {
        console.error("Error in getAllNotes controller", err)
        res.status(500).json({ message: "Internal server error."});
    }
}

export async function createNote(req, res) {
    try {
        const { title, content} = req.body;
        
    } catch (err) {
        console.error("Error creating note", err);
    }
}

export async function updateNote(req, res) {
    res.status(200).json({ message: "Note updated successfully!"});
}

export async function deleteNote(req, res) {
    res.status(200).json({ message: "Note deleted successfully!"});
}