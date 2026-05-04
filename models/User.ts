import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document {
  nom: string
  prenom: string
  email: string
  password: string
  role: 'admin' | 'employe'
  matricule?: string
  poste?: string
  departement?: string
  soldeConges: number
  telephone?: string
}

const UserSchema = new Schema<IUser>({
  nom:         { type: String, required: true },
  prenom:      { type: String, required: true },
  email:       { type: String, required: true, unique: true },
  password:    { type: String, required: true },
  role:        { type: String, enum: ['admin', 'employe'], default: 'employe' },
  matricule:   { type: String },
  poste:       { type: String },
  departement: { type: String },
  soldeConges: { type: Number, default: 18 },
  telephone:   { type: String },
}, { timestamps: true })

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema)