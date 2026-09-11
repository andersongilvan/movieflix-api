import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUniqueMovieTitle1788981506063 implements MigrationInterface {
    name = 'AddUniqueMovieTitle1788981506063'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "movies" ADD CONSTRAINT "UQ_5aa0bbd146c0082d3fc5a0ad5d8" UNIQUE ("title")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "movies" DROP CONSTRAINT "UQ_5aa0bbd146c0082d3fc5a0ad5d8"`);
    }

}
