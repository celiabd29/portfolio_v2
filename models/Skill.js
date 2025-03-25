import mongoose from "mongoose";

const SkillSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  image: { type: String, required: true },
  categorie: { type: String },
});

const Skill = mongoose.model("Skill", SkillSchema);

export default Skill;
