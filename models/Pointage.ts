import mongoose, { Schema, Document } from 'mongoose'

export interface IPointage extends Document {
  user_id: mongoose.Types.ObjectId
  date: string
  heure: string
  type: 'entree' | 'sortie'
  latitude: number
  longitude: number
  valide: boolean
  anomalie?: string
}

const PointageSchema = new Schema<IPointage>({
  user_id:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date:      { type: String, required: true },
  heure:     { type: String, required: true },
  type:      { type: String, enum: ['entree', 'sortie'], required: true },
  latitude:  { type: Number, required: true },
  longitude: { type: Number, required: true },
  valide:    { type: Boolean, default: false },
  anomalie:  { type: String },
}, { timestamps: true })

export default mongoose.models.Pointage || mongoose.model<IPointage>('Pointage', PointageSchema)