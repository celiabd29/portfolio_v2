import mongoose from "mongoose";

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ["Développement Web", "Graphisme & UX/UI"],
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
});

const Skill = mongoose.model("Skill", skillSchema);
export default Skill;
