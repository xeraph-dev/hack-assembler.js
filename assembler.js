#!/usr/bin/env bun
'use strict'
// @ts-check

import fs from 'fs'
import path from 'path'

const { argv } = process;

const input = path.resolve(argv.at(-1));


const jumps = {
  undefined: '000',
  JGT: '001',
  JEQ: '010',
  JGE: '011',
  JLT: '100',
  JNE: '101',
  JLE: '110',
  JMP: '111',
}

const dests = {
  0: '000',
  undefined: '000',
  M: '001',
  D: '010',
  MD: '011',
  A: '100',
  AM: '101',
  AD: '110',
  AMD: '111',
}

const addresses = {
  SP: 0,
  LCL: 1,
  ARG: 2,
  THIS: 3,
  THAT: 4,
  R0: 0,
  R1: 1,
  R2: 2,
  R3: 3,
  R4: 4,
  R5: 5,
  R6: 6,
  R7: 7,
  R8: 8,
  R9: 9,
  R10: 10,
  R11: 11,
  R12: 12,
  R13: 13,
  R14: 14,
  R15: 15,
  SCREEN: 16384,
  KBD: 24576,
}

const comps = [
  {
    0: '101010',
    1: '111111',
    '-1': '111010',
    D: '001100',
    A: '110000',
    '!D': '001101',
    '!A': '110001',
    '-D': '001111',
    '-A': '110011',
    'D+1': '011111',
    'A+1': '110111',
    'D-1': '001110',
    'A-1': '110010',
    'D+A': '000010',
    'D-A': '010011',
    'A-D': '000111',
    'D&A': '000000',
    'D|A': '010101',
  },
  {
    M: '110000',
    '!M': '110001',
    '-M': '110011',
    'M+1': '110111',
    'M-1': '110010',
    'D+M': '000010',
    'D-M': '010011',
    'M-D': '000111',
    'D&M': '000000',
    'D|M': '010101',
  },
  {
    undefined: '000000',
  },
]

const fileLines = fs.readFileSync(input, 'utf8').split(/\n/)

/** @type {Record<string, number>} */
const variables = {}

/** @type {string[]} */
const lines = []

/** @type {string[]} */
const binary = []

for (let i = 0; i < fileLines.length; i++) {
  let line = fileLines[i]
  line = line.replace(/[\r\t ]/g, '').trim()

  if (!line || line.startsWith('//')) continue
  line = line.split('//')[0]

  const matchLabel = line.startsWith('(') && line.endsWith(')')
  if (matchLabel) {
    const label = line.substring(1, line.length - 1)
    variables[label] = lines.length
    continue
  }

  lines.push(line)
}

let curr = 16

for (const line of lines) {
  if (line.startsWith('@')) {
    let address = line.substring(1)
    const name = address
    if (Number.isNaN(+address)) {
      address = addresses[address] ?? variables[address]

      if (typeof address === 'undefined' || address === null) {
        variables[name] = curr++
        address = variables[name]
      }
    }
    address = parseInt(address).toString(2)

    if (address.length <= 15) {
      address = '0' + '0'.repeat(15 - address.length) + address
    }

    binary.push(address)
  } else {
    let dest
    let comp
    let jump

    if (line.includes(';')) {
      const splitted = line.split(';')
      comp = splitted[0]
      jump = splitted[1]
    }
    if (line.includes('=')) {
      const splitted = line.split('=')
      dest = splitted[0]
      comp = splitted[1]
    }
    if (line.match(/=;/)) {
      let splitted = line.split('=')
      dest = splitted[0]
      splitted = splitted[1].split(';')
      comp = splitted[0]
      jump = splitted[1]
    }

    const a = +!!comps[1][comp]
    comp = comps[0][comp] ?? comp
    comp = comps[1][comp] ?? comp
    comp = comps[2][comp] ?? comp

    jump = jumps[jump]
    dest = dests[dest]

    binary.push(`111${a}${comp}${dest}${jump}`)
  }
}

const output = path.join(
  path.dirname(input),
  path.basename(input.replace(path.extname(input), '') + '.hack'),
)

fs.writeFileSync(output, binary.join('\n'), {
  encoding: 'utf-8',
  flag: 'w',
})
