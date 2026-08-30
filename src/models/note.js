import { Schema, model } from 'mongoose';

const tags = [
  'Work',
  'Personal',
  'Meeting',
  'Shopping',
  'Ideas',
  'Travel',
  'Finance',
  'Health',
  'Important',
  'Todo',
];

const noteSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    content: {
      type: String,
      default: '',
      trim: true,
    },

    tag: {
      type: String,
      enum: tags,
      default: 'Todo',
    },
  },
  {
    timestamps: true,
  },
);

const Note = model('Note', noteSchema);

export default Note;
