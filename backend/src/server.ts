import 'dotenv/config'
import app from './app'
import { PORT } from './Config/env'

const port = Number(PORT)
console.log(typeof port)
const server = app.listen(port, () => {
	console.log(`App is running on port: ${PORT}`)
})
