import createHttpError from "http-errors";
import { Note } from "../models/note.js";

export const getAllNotes = async (req, res) => {
const {
page = 1,
perPage = 10,
search = "",
tag,
} = req.query;

const currentPage = Number(page);
const currentPerPage = Number(perPage);

let notesQuery = Note.find();
if (tag) {
notesQuery = notesQuery.where("tag").equals(tag);
}
if (search) {
notesQuery = notesQuery.where({
$or: [
{ title: { $regex: search, $options: "i" } },
{ content: { $regex: search, $options: "i" } },
],
});
}

const [notes, totalNotes] = await Promise.all([
notesQuery
.clone()
.skip((currentPage - 1) * currentPerPage)
.limit(currentPerPage),

notesQuery.clone().countDocuments(),

]);

const totalPages = Math.ceil(totalNotes / currentPerPage);

res.status(200).json({
page: currentPage,
perPage: currentPerPage,
totalNotes,
totalPages,
notes,
});
};


export const getNoteById = async (req, res) => {
  const { noteId } = req.params;

  const note = await Note.findById(noteId);

  if (!note) {
    throw createHttpError(404, "Note not found");
  }

  res.status(200).json(note);
};

export const updateNote = async (req, res) => {
  const { noteId } = req.params;

  const note = await Note.findByIdAndUpdate(
    noteId,
    req.body,
    {
      returnDocument: 'after',
      runValidators: true,
    },
  );

  if (!note) {
    throw createHttpError(404, "Note not found");
  }

  res.status(200).json(note);
};

export const deleteNote = async (req, res) => {
  const { noteId } = req.params;

  const note = await Note.findByIdAndDelete(noteId);

  if (!note) {
    throw createHttpError(404, "Note not found");
  }

  res.status(200).json(note);
};
export const createNote = async (req, res) => {
  const note = await Note.create(req.body);

  res.status(201).json(note);
};
