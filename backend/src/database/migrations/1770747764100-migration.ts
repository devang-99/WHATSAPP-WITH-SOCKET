import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1770747764100 implements MigrationInterface {
  name = 'Migration1770747764100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "Users" ("id" SERIAL NOT NULL, "userid" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "username" character varying, "isOnline" boolean NOT NULL, "role" character varying NOT NULL DEFAULT 'user', "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updatedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, CONSTRAINT "UQ_e372629e4ce70b4ebe2417d8919" UNIQUE ("userid"), CONSTRAINT "UQ_3c3ab3f49a87e6ddb607f3c4945" UNIQUE ("email"), CONSTRAINT "UQ_ffc81a3b97dcbf8e320d5106c0d" UNIQUE ("username"), CONSTRAINT "PK_16d4f7d636df336db11d87413e3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "Messages" ("id" SERIAL NOT NULL, "roomId" character varying NOT NULL, "senderId" character varying NOT NULL, "receiverId" character varying NOT NULL, "message" character varying(500) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, CONSTRAINT "PK_ecc722506c4b974388431745e8b" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "Messages"`);
    await queryRunner.query(`DROP TABLE "Users"`);
  }
}
