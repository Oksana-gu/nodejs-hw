import { Note } from '../models/note.js';
import createHttpError from "http-errors";
export const getAllNotes = async (req, res) => {
const {
page = 1,
perPage = 10,
tag,
search,
} = req.query;

const skip = (page - 1) * perPage;

const query = {};

if (tag) {
query.tag = tag;
}

if (search) {
query.$or = [
{
title: {
$regex: search,
$options: 'i',
},
},
{
content: {
$regex: search,
$options: 'i',
},
},
];
}

const [notes, totalNotes] = await Promise.all([
Note.find(query)
.skip(skip)
.limit(perPage),

Note.countDocuments(query),

]);

const totalPages = Math.ceil(totalNotes / perPage);

res.status(200).json({
page,
perPage,
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

  res.status(200).json({
    status: 200,
    message: "Successfully found note!",
    data: note,
  });
};

export const createNote = async (req, res) => {
const note = await Note.create(req.body);

res.status(201).json({
message: 'Successfully created a note!',
note,
});
};

export const updateNote = async (req, res) => {
  const { noteId } = req.params;

  const note = await Note.findByIdAndUpdate(
    noteId,
    req.body,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!note) {
    throw createHttpError(404, "Note not found");
  }

  res.status(200).json({
    status: 200,
    message: "Successfully updated a note!",
    data: note,
  });
};

export const deleteNote = async (req, res) => {
  const { noteId } = req.params;

  const note = await Note.findByIdAndDelete(noteId);

  if (!note) {
    throw createHttpError(404, "Note not found");
  }

  res.status(200).json({
    status: 200,
    message: "Successfully deleted a note!",
    data: note,
  });
};
