import type { StoreDoc } from '../types';
import { ARCHIVE_ID } from './schema';

export function seedDoc(now = Date.now()): StoreDoc {
  return {
    updated: now,
    activePageId: 'pessoal',
    pages: [
      {
        id: 'pessoal',
        title: 'pessoal',
        kind: 'page',
        sections: [
          { id: 'geral', title: 'geral' },
          { id: 'def', title: 'def' },
        ],
        notes: [
          {
            id: 'leite',
            section: 'geral',
            text: 'leite\ncomprar 2 litros',
            created: now - 3000,
            updated: now - 3000,
          },
          {
            id: 'hmi',
            section: 'def',
            text: 'HMI\nInterface homem-maquina\nhttps://en.wikipedia.org/wiki/Human%E2%80%93machine_interface',
            links: [
              {
                url: 'https://en.wikipedia.org/wiki/Human%E2%80%93machine_interface',
                title: 'HMI',
              },
            ],
            created: now - 2000,
            updated: now - 2000,
          },
        ],
      },
      {
        id: 'trabalho',
        title: 'trabalho',
        kind: 'page',
        sections: [{ id: 'geral', title: 'geral' }],
        notes: [
          {
            id: 'pwm',
            section: 'geral',
            text: 'PWM\nModulação por largura de pulso, duty cycle 50%',
            created: now - 1000,
            updated: now - 1000,
          },
        ],
      },
      {
        id: ARCHIVE_ID,
        title: 'arquivo',
        kind: 'archive',
        sections: [{ id: 'geral', title: 'geral' }],
        notes: [],
      },
    ],
  };
}
