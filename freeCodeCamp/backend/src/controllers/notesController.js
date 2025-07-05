import mongoose from "mongoose";
import Note from "../models/Note.js";

export async function getAllNotes(_, res) {
    try {
        const notes = await Note.find().sort({ createdAt: -1 });
        return res.status(200).json(notes);
    } catch (err) {
        console.error("Error in getAllNotes controller", err);
        return res.status(500).json({ message: "Internal server error." });
    }
}

export async function createNote(req, res) {
    try {
        const { title, content } = req.body;
        const newNote = new Note({ title, content });
        await newNote.save();
        return res.status(201).json({ message: "Note created successfully..!" });
    } catch (err) {
        console.error("Error creating note", err);
        return res.status(500).json({ message: "Server Error" });
    }
}

export async function updateNote(req, res) {
    try {
        const { title, content } = req.body;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid note ID" });
        }

        const updatedNote = await Note.findByIdAndUpdate(id, { title, content }, { new: true });

        if (!updatedNote) {
            return res.status(404).json({ message: "Note not found" });
        }

        return res.status(200).json({ message: "Note Updated successfully...!" });
    } catch (error) {
        console.error("Error in updating Note", error);
        return res.status(500).json({ message: "Server Error" });
    }
}

export async function deleteNote(req, res) {
    try {
        const deletedNote = await Note.findByIdAndDelete(req.params.id);

        if (!deletedNote) {
            return res.status(404).json({ message: "Note not found." });
        }

        return res.status(202).json({ message: "Note Deleted Successfully...!" });
    } catch (error) {
        console.error("Error while deleting Note", error);
        return res.status(500).json({ message: "Server Error" });
    }
}

export async function getNoteById(req, res) {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).json({ message: "Note not found...!" });
        }

        return res.status(200).json(note); 
    } catch (error) {
        console.error("Error while getting Note", error);
        return res.status(500).json({ message: "Server Error" });
    }
}
