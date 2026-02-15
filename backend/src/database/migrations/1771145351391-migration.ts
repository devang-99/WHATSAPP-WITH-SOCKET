import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1771145351391 implements MigrationInterface {
  name = 'Migration1771145351391';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Users" ADD "bio" character varying`);
    await queryRunner.query(
      `ALTER TABLE "Users" ADD "profilePic" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "profilePic"`);
    await queryRunner.query(`ALTER TABLE "Users" DROP COLUMN "bio"`);
  }
}
