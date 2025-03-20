import mongoose from "mongoose";

const skillSchema = new mongoose.Schema({
  category: { type: String, required: true },
  name: { type: String, required: true },
  icon: { type: String, required: true }, // URL ou chemin de l'icône
});

const Skill = mongoose.model("Skill", skillSchema);

export default Skill;
