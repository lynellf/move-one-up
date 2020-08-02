import readline from 'readline'
import { rename } from 'fs'
import * as fsScandir from '@nodelib/fs.scandir'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const settings = new fsScandir.Settings({ stats: true })

export function getRootDir(question: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      rl.question(question, (dir) => resolve(dir))
    } catch (error) {
      reject(error)
    }
  })
}

type TContentItem = {
  dirent: fsScandir.Dirent
  name: string
  path: string
}

export function getDirContents(path: string): Promise<TContentItem[]> {
  return new Promise((resolve, reject) => {
    fsScandir.scandir(path, settings, (error, entries) => {
      if (error) {
        reject(error)
      }
      resolve(entries)
    })
  })
}

function onlyDirs(item: TContentItem) {
  return item.dirent.isDirectory()
}

function onlyFiles(item: TContentItem) {
  return item.dirent.isFile()
}

function moveFile(basePath: string, rootDir: string) {
  return new Promise(async (_resolve, reject) => {
    const contents = await getDirContents(basePath)
    const hasFiles = contents.length > 0
    if (hasFiles) {
      const {
        path: oldPath,
        dirent: { name },
      } = contents[0]
      rename(oldPath, `${rootDir}/${name}`, (err) => reject(err))
    }
  })
}

function moveFiles(dirs: TContentItem[], rootDir: string) {
  const len = dirs.length
  for (let index = 0; index < len; index++) {
    const dir = dirs[index]
    moveFile(dir.path, rootDir)
    if (index === len) {
      rl.close()
    }
  }
}

async function main() {
  try {
    const rootDir = await getRootDir('Enter root directory name\n')
    const rootDirContents = await getDirContents(rootDir)
    const dirs = rootDirContents.filter(onlyDirs)
    moveFiles(dirs, rootDir)
  } catch (error) {
    console.error(error)
    rl.close()
  }
}

main()
