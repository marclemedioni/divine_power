// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { poeNinjaService } from './poe-ninja.service';

// Mock Prisma
vi.mock('../db', () => ({
  prisma: {
    marketItem: {
      upsert: vi.fn().mockResolvedValue({ id: 'mock', detailsId: 'mock-details' }),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    marketPair: {
      upsert: vi.fn().mockResolvedValue({ id: 'pair' }),
    },
    marketHistory: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
  },
}));

// Mock FS
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  return {
    ...actual,
    existsSync: vi.fn().mockReturnValue(true), // Assume assets dir exists
    mkdirSync: vi.fn(),
    createWriteStream: vi.fn(),
  };
});

// Mock Global Fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('PoeNinjaService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockReset();
  });

  it('should fetch overview for Currency, Ritual, and Abyss', async () => {
    // Mock responses
    // Just return empty overview to avoid processing loop details
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ items: [], lines: [] }), 
    });

    await poeNinjaService.updateAll();

    const overviewCalls = fetchMock.mock.calls.filter(call => 
      typeof call[0] === 'string' && call[0].includes('/overview')
    );

    // Should be called for Currency, Ritual, Abyss
    expect(overviewCalls).toHaveLength(3);
    
    // Check URLs
    const urls = overviewCalls.map(c => c[0] as string);
    expect(urls.some(u => u.includes('type=Currency'))).toBe(true);
    expect(urls.some(u => u.includes('type=Ritual'))).toBe(true);
    expect(urls.some(u => u.includes('type=Abyss'))).toBe(true);
  });
});
