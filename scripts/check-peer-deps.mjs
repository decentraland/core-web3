#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import semver from 'semver'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(resolve(__dirname, '..', 'package.json'), 'utf8'))

const peers = pkg.peerDependencies ?? {}
const peersMeta = pkg.peerDependenciesMeta ?? {}
const devs = pkg.devDependencies ?? {}

const errors = []
for (const [name, peerRange] of Object.entries(peers)) {
  const devRange = devs[name]
  const optional = peersMeta[name]?.optional === true
  if (!devRange) {
    if (optional) continue
    errors.push(`${name}: peer (${peerRange}) missing from devDependencies — install it to test against what consumers resolve`)
    continue
  }
  const devVersion = semver.minVersion(devRange)
  if (!devVersion) {
    errors.push(`${name}: devDependencies "${devRange}" is not a valid semver`)
    continue
  }
  if (!semver.satisfies(devVersion, peerRange, { includePrerelease: true })) {
    errors.push(`${name}: devDependencies "${devRange}" does not satisfy peerDependencies "${peerRange}"`)
  }
}

if (errors.length > 0) {
  console.error('check-peer-deps: peerDependencies and devDependencies are misaligned:')
  for (const err of errors) console.error('  - ' + err)
  process.exit(1)
}
console.log('check-peer-deps: ok')
