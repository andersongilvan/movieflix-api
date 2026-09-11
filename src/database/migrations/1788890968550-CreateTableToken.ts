import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateTableToken1788890968550 implements MigrationInterface {
  name = 'CreateTableToken1788890968550'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."tokens_type_enum" AS ENUM('password_reset', 'email_verification')`)
    await queryRunner.query(
      `CREATE TABLE "tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token_hash" character varying(255) NOT NULL, "type" "public"."tokens_type_enum" NOT NULL, "user_id" uuid NOT NULL, "expires_at" TIMESTAMP NOT NULL, "used_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3001e89ada36263dabf1fb6210a" PRIMARY KEY ("id"))`,
    )
    await queryRunner.query(`CREATE INDEX "IDX_989478f994a58e1a3b8b9b35a0" ON "tokens"  ("token_hash") `)
    await queryRunner.query(
      `ALTER TABLE "tokens" ADD CONSTRAINT "FK_8769073e38c365f315426554ca5" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tokens" DROP CONSTRAINT "FK_8769073e38c365f315426554ca5"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_989478f994a58e1a3b8b9b35a0"`)
    await queryRunner.query(`DROP TABLE "tokens"`)
    await queryRunner.query(`DROP TYPE "public"."tokens_type_enum"`)
  }
}
