import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateHRAdminTables1752571148331 implements MigrationInterface {
    name = 'CreateHRAdminTables1752571148331'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "sub_teams" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "description" text, "team_id" integer NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_b318b1cbf6f21ccff3f3c406cbb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_SUB_TEAM_NAME_TEAM" ON "sub_teams" ("name", "team_id") WHERE deleted_at IS NULL`);
        await queryRunner.query(`ALTER TABLE "teams" ADD "description" text`);
        await queryRunner.query(`ALTER TABLE "teams" ADD "is_active" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "teams" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "teams" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "teams" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "positions" ADD "description" text`);
        await queryRunner.query(`ALTER TABLE "positions" ADD "is_active" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "positions" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "positions" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "positions" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ADD "sub_team_id" integer`);
        await queryRunner.query(`ALTER TABLE "teams" DROP CONSTRAINT "UQ_48c0c32e6247a2de155baeaf980"`);
        await queryRunner.query(`ALTER TABLE "teams" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "teams" ADD "name" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "positions" DROP CONSTRAINT "UQ_5c70dc5aa01e351730e4ffc929c"`);
        await queryRunner.query(`ALTER TABLE "positions" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "positions" ADD "name" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_ac88a74dd297a21674a11c64704"`);
        await queryRunner.query(`ALTER TABLE "assessment_requests" DROP CONSTRAINT "FK_1ed1878d472a8f0ebe37c4bc045"`);
        await queryRunner.query(`ALTER TABLE "audit" DROP CONSTRAINT "FK_03c1960edacd7e8013321247202"`);
        await queryRunner.query(`ALTER TABLE "target" DROP CONSTRAINT "FK_de25ee089655161469f630c63f0"`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_a3ffb1c0c8416b9fc6f907b7433" UNIQUE ("id")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_TEAM_NAME" ON "teams" ("name") WHERE deleted_at IS NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_POSITION_NAME" ON "positions" ("name") WHERE deleted_at IS NULL`);
        await queryRunner.query(`ALTER TABLE "assessment_requests" ADD CONSTRAINT "FK_1ed1878d472a8f0ebe37c4bc045" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sub_teams" ADD CONSTRAINT "FK_0321073b3d500460c4b050513f0" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_ac88a74dd297a21674a11c64704" FOREIGN KEY ("lead_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_849a79def7808347202446c179b" FOREIGN KEY ("hr_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_414932fc8b8d4b9ab4fedaa7abc" FOREIGN KEY ("sub_team_id") REFERENCES "sub_teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit" ADD CONSTRAINT "FK_03c1960edacd7e8013321247202" FOREIGN KEY ("editor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "target" ADD CONSTRAINT "FK_de25ee089655161469f630c63f0" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "target" DROP CONSTRAINT "FK_de25ee089655161469f630c63f0"`);
        await queryRunner.query(`ALTER TABLE "audit" DROP CONSTRAINT "FK_03c1960edacd7e8013321247202"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_414932fc8b8d4b9ab4fedaa7abc"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_849a79def7808347202446c179b"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_ac88a74dd297a21674a11c64704"`);
        await queryRunner.query(`ALTER TABLE "sub_teams" DROP CONSTRAINT "FK_0321073b3d500460c4b050513f0"`);
        await queryRunner.query(`ALTER TABLE "assessment_requests" DROP CONSTRAINT "FK_1ed1878d472a8f0ebe37c4bc045"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_POSITION_NAME"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_TEAM_NAME"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_a3ffb1c0c8416b9fc6f907b7433"`);
        await queryRunner.query(`ALTER TABLE "target" ADD CONSTRAINT "FK_de25ee089655161469f630c63f0" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit" ADD CONSTRAINT "FK_03c1960edacd7e8013321247202" FOREIGN KEY ("editor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "assessment_requests" ADD CONSTRAINT "FK_1ed1878d472a8f0ebe37c4bc045" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_ac88a74dd297a21674a11c64704" FOREIGN KEY ("lead_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "positions" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "positions" ADD "name" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "positions" ADD CONSTRAINT "UQ_5c70dc5aa01e351730e4ffc929c" UNIQUE ("name")`);
        await queryRunner.query(`ALTER TABLE "teams" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "teams" ADD "name" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "teams" ADD CONSTRAINT "UQ_48c0c32e6247a2de155baeaf980" UNIQUE ("name")`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "sub_team_id"`);
        await queryRunner.query(`ALTER TABLE "positions" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "positions" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "positions" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "positions" DROP COLUMN "is_active"`);
        await queryRunner.query(`ALTER TABLE "positions" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "teams" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "teams" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "teams" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "teams" DROP COLUMN "is_active"`);
        await queryRunner.query(`ALTER TABLE "teams" DROP COLUMN "description"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_SUB_TEAM_NAME_TEAM"`);
        await queryRunner.query(`DROP TABLE "sub_teams"`);
    }

}
