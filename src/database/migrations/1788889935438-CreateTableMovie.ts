import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateTableMovie1788889935438 implements MigrationInterface {
  name = 'CreateTableMovie1788889935438'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "movies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(255) NOT NULL, "description" text, "release_year" smallint NOT NULL, "duration_in_minutes" integer NOT NULL, "img_url" character varying(255) NOT NULL, CONSTRAINT "PK_c5b2c134e871bfd1c2fe7cc3705" PRIMARY KEY ("id"))`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "movies"`)
  }
}
