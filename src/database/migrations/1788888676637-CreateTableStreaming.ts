import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateTableStreaming1788888676637 implements MigrationInterface {
  name = 'CreateTableStreaming1788888676637'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "streamings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(255) NOT NULL, "imgUrl" character varying(255) NOT NULL, CONSTRAINT "PK_28c1b283a792f76762d2c61b445" PRIMARY KEY ("id"))`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "streamings"`)
  }
}
