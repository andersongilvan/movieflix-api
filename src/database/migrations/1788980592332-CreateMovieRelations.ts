import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateMovieRelations1788980592332 implements MigrationInterface {
  name = 'CreateMovieRelations1788980592332'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "movie_categories" ("movie_id" uuid NOT NULL, "category_id" uuid NOT NULL, CONSTRAINT "PK_228491b14a2bda5461459ba3e72" PRIMARY KEY ("movie_id", "category_id"))`,
    )
    await queryRunner.query(`CREATE INDEX "IDX_9a54f0b179807b525748a8321c" ON "movie_categories" ("movie_id") `)
    await queryRunner.query(`CREATE INDEX "IDX_b46ca93039a474fe37dbd4c0d3" ON "movie_categories" ("category_id") `)
    await queryRunner.query(
      `CREATE TABLE "movie_streaming_platforms" ("movie_id" uuid NOT NULL, "streaming_platform_id" uuid NOT NULL, CONSTRAINT "PK_4d916f89b5695efb71ad7920b2d" PRIMARY KEY ("movie_id", "streaming_platform_id"))`,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_3aafdb5297b65f28a32c674e4d" ON "movie_streaming_platforms" ("movie_id") `,
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_9c6c7f1ee6ade267da16a66b95" ON "movie_streaming_platforms" ("streaming_platform_id") `,
    )
    await queryRunner.query(
      `ALTER TABLE "movie_categories" ADD CONSTRAINT "FK_9a54f0b179807b525748a8321c8" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    )
    await queryRunner.query(
      `ALTER TABLE "movie_categories" ADD CONSTRAINT "FK_b46ca93039a474fe37dbd4c0d3d" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    )
    await queryRunner.query(
      `ALTER TABLE "movie_streaming_platforms" ADD CONSTRAINT "FK_3aafdb5297b65f28a32c674e4d2" FOREIGN KEY ("movie_id") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    )
    await queryRunner.query(
      `ALTER TABLE "movie_streaming_platforms" ADD CONSTRAINT "FK_9c6c7f1ee6ade267da16a66b950" FOREIGN KEY ("streaming_platform_id") REFERENCES "streamings"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "movie_streaming_platforms" DROP CONSTRAINT "FK_9c6c7f1ee6ade267da16a66b950"`)
    await queryRunner.query(`ALTER TABLE "movie_streaming_platforms" DROP CONSTRAINT "FK_3aafdb5297b65f28a32c674e4d2"`)
    await queryRunner.query(`ALTER TABLE "movie_categories" DROP CONSTRAINT "FK_b46ca93039a474fe37dbd4c0d3d"`)
    await queryRunner.query(`ALTER TABLE "movie_categories" DROP CONSTRAINT "FK_9a54f0b179807b525748a8321c8"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_9c6c7f1ee6ade267da16a66b95"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_3aafdb5297b65f28a32c674e4d"`)
    await queryRunner.query(`DROP TABLE "movie_streaming_platforms"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_b46ca93039a474fe37dbd4c0d3"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_9a54f0b179807b525748a8321c"`)
    await queryRunner.query(`DROP TABLE "movie_categories"`)
  }
}
