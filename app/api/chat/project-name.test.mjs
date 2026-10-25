import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialProjectName } from './project-name.ts';

test('uses the explicit name before slug creation in English and Spanish', () => {
  assert.equal(initialProjectName('Create an app called “My Savings” to track a personal savings goal.'), 'My Savings');
  assert.equal(initialProjectName('Crea una landing page para una cafetería llamada “Bruma”.'), 'Bruma');
  assert.equal(initialProjectName('Crea una tienda llamada Luna para vender café.'), 'Luna');
  assert.equal(initialProjectName('Build an app named Savings Tracker with a blue theme.'), 'Savings Tracker');
});

test('uses a short description without mistaking quoted UI copy for an app name', () => {
  assert.equal(initialProjectName('Create a personal savings tracker. Include a button “Add savings”.'), 'Personal savings tracker');
  assert.equal(initialProjectName('Crea una app de ahorro personal\nIncluye movimientos recientes.'), 'App de ahorro personal');
  assert.equal(initialProjectName('Create a budgeting dashboard for friends with weekly contributions'), 'Budgeting dashboard for friends with weekly');
});
