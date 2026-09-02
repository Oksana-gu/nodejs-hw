import { Schema, model } from 'mongoose';
import { TAGS } from '../constants/tags.js';

const noteSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },

    content: {
      type: String,
      default: '',
    },

    tag: {
      type: String,
      enum: TAGS,
      default: 'Todo',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);
noteSchema.index({ tag: 1 });
export const Note = model('Note', noteSchema);
