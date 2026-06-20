/**
 * SC2Map / SC2Mod archive utilities.
 * SC2Map/SC2Mod files are ZIP archives containing XML data, Galaxy scripts, etc.
 */
import JSZip from 'jszip';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, extname } from 'node:path';

export interface SC2ArchiveEntry {
  path: string;
  isDir: boolean;
}

export interface SC2ArchiveInfo {
  path: string;
  entryCount: number;
  entries: SC2ArchiveEntry[];
}

export async function listArchive(archivePath: string): Promise<SC2ArchiveInfo> {
  const data = await readFile(archivePath);
  const zip = await JSZip.loadAsync(data);
  const entries: SC2ArchiveEntry[] = [];
  zip.forEach((relativePath, entry) => {
    entries.push({ path: relativePath, isDir: entry.dir });
  });
  return { path: archivePath, entryCount: entries.length, entries };
}

export async function extractFile(archivePath: string, filePath: string): Promise<string> {
  const data = await readFile(archivePath);
  const zip = await JSZip.loadAsync(data);
  const entry = zip.file(filePath);
  if (!entry) {
    throw new Error(`File not found in archive: ${filePath}`);
  }
  return entry.async('text');
}

export async function extractFilesByPattern(
  archivePath: string,
  pattern: RegExp
): Promise<Array<{ path: string; content: string }>> {
  const data = await readFile(archivePath);
  const zip = await JSZip.loadAsync(data);
  const results: Array<{ path: string; content: string }> = [];
  const matchingFiles: string[] = [];
  zip.forEach((relativePath) => {
    if (pattern.test(relativePath)) {
      matchingFiles.push(relativePath);
    }
  });
  for (const filePath of matchingFiles) {
    const entry = zip.file(filePath);
    if (entry) {
      const content = await entry.async('text');
      results.push({ path: filePath, content });
    }
  }
  return results;
}

export async function extractGalaxyScripts(archivePath: string): Promise<Array<{ path: string; content: string }>> {
  return extractFilesByPattern(archivePath, /\.galaxy$/i);
}

export async function extractXmlData(archivePath: string): Promise<Array<{ path: string; content: string }>> {
  return extractFilesByPattern(archivePath, /\.xml$/i);
}

export async function writeFileToArchive(
  archivePath: string,
  filePath: string,
  content: string
): Promise<void> {
  const data = await readFile(archivePath);
  const zip = await JSZip.loadAsync(data);
  zip.file(filePath, content);
  const output = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });
  await writeFile(archivePath, output);
}

export function isSC2Archive(filePath: string): boolean {
  const ext = extname(filePath).toLowerCase();
  return ['.sc2map', '.sc2mod', '.sc2archive', '.sc2campaign', '.sc2interface'].includes(ext);
}

export async function readLooseDirectory(dirPath: string): Promise<Array<{ path: string; content: string }>> {
  const results: Array<{ path: string; content: string }> = [];
  async function walk(currentDir: string, relativePrefix: string) {
    const entries = await readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      const relativePath = relativePrefix ? `${relativePrefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        await walk(fullPath, relativePath);
      } else if (entry.isFile()) {
        const content = await readFile(fullPath, 'utf-8');
        results.push({ path: relativePath, content });
      }
    }
  }
  await walk(dirPath, '');
  return results;
}