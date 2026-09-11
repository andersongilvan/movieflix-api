import dataSource from '../data-source'
import { CategoryEntity } from '@/category/entities/category.entity'
import { StreamingEntity } from '@/streaming/entities/streaming.entity'
import { MovieEntity } from '@/movie/entities/movie.entity'
import { CATEGORY_TITLES, MOVIES, STREAMINGS, movieImgUrl } from './catalog.data'

async function upsertCategories(): Promise<Map<string, CategoryEntity>> {
  const repo = dataSource.getRepository(CategoryEntity)
  const byTitle = new Map<string, CategoryEntity>()

  for (const title of CATEGORY_TITLES) {
    let category = await repo.findOne({ where: { title } })
    if (!category) {
      category = await repo.save(repo.create({ title }))
    }
    byTitle.set(title, category)
  }

  return byTitle
}

async function upsertStreamings(): Promise<Map<string, StreamingEntity>> {
  const repo = dataSource.getRepository(StreamingEntity)
  const byTitle = new Map<string, StreamingEntity>()

  for (const item of STREAMINGS) {
    let streaming = await repo.findOne({ where: { title: item.title } })
    if (!streaming) {
      streaming = await repo.save(repo.create({ title: item.title, imgUrl: item.imgUrl }))
    }
    byTitle.set(item.title, streaming)
  }

  return byTitle
}

function resolveRelations<T>(titles: string[], byTitle: Map<string, T>, kind: string): T[] {
  return titles.map(title => {
    const entity = byTitle.get(title)
    if (!entity) {
      throw new Error(`Seed ${kind} not found: ${title}`)
    }
    return entity
  })
}

async function upsertMovies(
  categoriesByTitle: Map<string, CategoryEntity>,
  streamingsByTitle: Map<string, StreamingEntity>,
): Promise<{ created: number; skipped: number }> {
  const repo = dataSource.getRepository(MovieEntity)
  let created = 0
  let skipped = 0

  for (const movie of MOVIES) {
    const existing = await repo.findOne({ where: { title: movie.title } })
    if (existing) {
      skipped += 1
      continue
    }

    await repo.save(
      repo.create({
        title: movie.title,
        description: movie.description,
        releaseYear: movie.releaseYear,
        durationInMinutes: movie.durationInMinutes,
        imgUrl: movieImgUrl(movie.title),
        categories: resolveRelations(movie.categories, categoriesByTitle, 'category'),
        streamingPlatforms: resolveRelations(movie.streamings, streamingsByTitle, 'streaming'),
      }),
    )
    created += 1
  }

  return { created, skipped }
}

async function run(): Promise<void> {
  if (MOVIES.length !== 50) {
    throw new Error(`Expected 50 movies in seed data, got ${MOVIES.length}`)
  }

  await dataSource.initialize()

  try {
    const categories = await upsertCategories()
    const streamings = await upsertStreamings()
    const movies = await upsertMovies(categories, streamings)

    console.log(
      `Seed ok: ${categories.size} categories, ${streamings.size} streamings, ${movies.created} movies created, ${movies.skipped} movies skipped`,
    )
  } finally {
    await dataSource.destroy()
  }
}

void run().catch(error => {
  console.error(error)
  process.exit(1)
})
