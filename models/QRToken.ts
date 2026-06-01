import mongoose from 'mongoose'

const QRTokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  radiusMeters: { type: Number, required: true, default: 100 },
})

export default mongoose.models.QRToken || mongoose.model('QRToken', QRTokenSchema)
