import mongoose, { Schema, Document } from 'mongoose'

export interface IConge extends Document {
  user_id: mongoose.Types.ObjectId
  date_debut: Date
  date_fin: Date
  type: 'annuel' | 'maladie' | 'exceptionnel'
  motif: string
  statut: 'en_attente' | 'valide' | 'refuse'
  validePar?: mongoose.Types.ObjectId
  dateValidation?: Date
}

const CongeSchema = new Schema<IConge>({
  user_id:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date_debut:     { type: Date, required: true },
  date_fin:       { type: Date, required: true },
  type:           { type: String, enum: ['annuel', 'maladie', 'exceptionnel'], required: true },
  motif:          { type: String, required: true },
  statut:         { type: String, enum: ['en_attente', 'valide', 'refuse'], default: 'en_attente' },
  validePar:      { type: Schema.Types.ObjectId, ref: 'User' },
  dateValidation: { type: Date },
}, { timestamps: true })

export default mongoose.models.Conge || mongoose.model<IConge>('Conge', CongeSchema)