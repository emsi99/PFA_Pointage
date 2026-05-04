import mongoose, { Schema, Document } from 'mongoose'

export interface IQRCode extends Document {
  token: string
  expiration: Date
  actif: boolean
  generedBy: mongoose.Types.ObjectId
  zone_id?: mongoose.Types.ObjectId
}

const QRCodeSchema = new Schema<IQRCode>({
  token:      { type: String, required: true, unique: true },
  expiration: { type: Date, required: true },
  actif:      { type: Boolean, default: true },
  generedBy:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
  zone_id:    { type: Schema.Types.ObjectId, ref: 'Zone' },
}, { timestamps: true })

export default mongoose.models.QRCode || mongoose.model<IQRCode>('QRCode', QRCodeSchema)