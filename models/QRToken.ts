import mongoose from 'mongoose'

const QRTokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true },
})

export default mongoose.models.QRToken || mongoose.model('QRToken', QRTokenSchema)