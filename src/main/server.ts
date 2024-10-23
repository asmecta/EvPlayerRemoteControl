import express, { Request, Response } from 'express'
import path from 'path'
import cors from 'cors'
import { BrowserWindow } from 'electron'
import { IpcEvents } from '../common/ipcEvents'
import { store } from './store'

const expressApp = express()
const port = 3000

expressApp.use(cors())
expressApp.use(express.static(path.join(__dirname, '..', 'static')))
expressApp.use(express.json())
expressApp.set('view engine', 'ejs')
expressApp.set('views', path.join(__dirname, '..', 'views'))

export function startExpressServer(mainWindow: BrowserWindow | null): void {
  expressApp.get('/home', (_: Request, res: Response) => {
    res.send('Hello Index')
  })

  expressApp.get('/', (_: Request, res: Response) => {
    const playList = store.get('playlist')
    res.render('index', { title: '潮起钱江，金融赋能', data: playList })
  })

  expressApp.post('/play', (req: Request, res: Response) => {
    mainWindow?.webContents.send(IpcEvents.EV_PLAY, [req.body.data])
    res.json(req.body)
  })

  expressApp.get('/minimize', (_: Request, res: Response) => {
    mainWindow?.minimize()
    res.send('Windwos minimized')
  })
  expressApp.get('/maximize', (_: Request, res: Response) => {
    mainWindow?.maximize()
    res.send('Windwos maximize')
  })
  expressApp.listen(port, () => {
    console.log(`Express server running on http://localhost:${port}`)
  })
}
