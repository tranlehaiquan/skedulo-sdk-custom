import * as fs from 'fs'
import * as path from 'path'
import { getPlatform } from '../../platform'

export interface LinkDefinition {
  sourcePath: string
  linkPath: string
}

export function createSymlinks(linksToCreate: LinkDefinition[]) {
  return linksToCreate.forEach(createLink)
}

function createLink(link: LinkDefinition) {
  const sourcePath = path.normalize(link.sourcePath).replace(RegExp(path.sep + '$'), '')
  const linkPath = path.normalize(link.linkPath).replace(RegExp(path.sep + '$'), '')

  if (fs.existsSync(linkPath)) {
    // Attempt to unlink, this will identify if the link is in-fact a link and not an absolute path
    fs.unlinkSync(linkPath)
  }

  const isWindows = getPlatform() === 'win'
  let linkType: fs.symlink.Type | null = isWindows ? 'file' : null

  if (!fs.existsSync(sourcePath)) {
    throw new Error('Source path for link does not exist: ' + sourcePath)
  } else if (isWindows && fs.statSync(sourcePath).isDirectory()) {
    linkType = 'junction'
  }

  fs.symlinkSync(sourcePath, linkPath, linkType)
}
