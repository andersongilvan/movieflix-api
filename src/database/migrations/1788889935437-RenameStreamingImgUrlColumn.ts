import { MigrationInterface, QueryRunner } from 'typeorm'

export class RenameStreamingImgUrlColumn1788889935437 implements MigrationInterface {
  name = 'RenameStreamingImgUrlColumn1788889935437'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "streamings" RENAME COLUMN "imgUrl" TO "img_url"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "streamings" RENAME COLUMN "img_url" TO "imgUrl"`)
  }
}
