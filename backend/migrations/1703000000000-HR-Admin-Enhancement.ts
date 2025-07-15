import { MigrationInterface, QueryRunner } from "typeorm";

export class HRAdminEnhancement1703000000000 implements MigrationInterface {
    name = 'HRAdminEnhancement1703000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add new columns to teams table
        await queryRunner.query(`
            ALTER TABLE "teams" 
            ADD COLUMN "description" text,
            ADD COLUMN "is_active" boolean DEFAULT true,
            ADD COLUMN "created_at" timestamp DEFAULT now(),
            ADD COLUMN "updated_at" timestamp DEFAULT now(),
            ADD COLUMN "deleted_at" timestamp
        `);

        // Add new columns to positions table
        await queryRunner.query(`
            ALTER TABLE "positions" 
            ADD COLUMN "description" text,
            ADD COLUMN "is_active" boolean DEFAULT true,
            ADD COLUMN "created_at" timestamp DEFAULT now(),
            ADD COLUMN "updated_at" timestamp DEFAULT now(),
            ADD COLUMN "deleted_at" timestamp
        `);

        // Create sub_teams table
        await queryRunner.query(`
            CREATE TABLE "sub_teams" (
                "id" SERIAL NOT NULL,
                "name" varchar(255) NOT NULL,
                "description" text,
                "team_id" integer NOT NULL,
                "is_active" boolean DEFAULT true,
                "created_at" timestamp DEFAULT now(),
                "updated_at" timestamp DEFAULT now(),
                "deleted_at" timestamp,
                CONSTRAINT "PK_sub_teams" PRIMARY KEY ("id")
            )
        `);

        // Add foreign key constraint for sub_teams
        await queryRunner.query(`
            ALTER TABLE "sub_teams" 
            ADD CONSTRAINT "FK_sub_teams_team_id" 
            FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE
        `);

        // Add sub_team_id to users table
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN "sub_team_id" integer
        `);

        // Add foreign key constraint for users sub_team_id
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD CONSTRAINT "FK_users_sub_team_id" 
            FOREIGN KEY ("sub_team_id") REFERENCES "sub_teams"("id") ON DELETE SET NULL
        `);

        // Create unique indexes for soft-deleted records
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_TEAM_NAME" 
            ON "teams"("name") 
            WHERE "deleted_at" IS NULL
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_POSITION_NAME" 
            ON "positions"("name") 
            WHERE "deleted_at" IS NULL
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_SUB_TEAM_NAME_TEAM" 
            ON "sub_teams"("name", "team_id") 
            WHERE "deleted_at" IS NULL
        `);

        // Drop old unique constraints if they exist
        await queryRunner.query(`
            ALTER TABLE "teams" DROP CONSTRAINT IF EXISTS "UQ_teams_name"
        `);
        
        await queryRunner.query(`
            ALTER TABLE "positions" DROP CONSTRAINT IF EXISTS "UQ_positions_name"
        `);

        // Update existing records to set default values
        await queryRunner.query(`
            UPDATE "teams" 
            SET "is_active" = true, 
                "created_at" = now(), 
                "updated_at" = now()
            WHERE "is_active" IS NULL
        `);

        await queryRunner.query(`
            UPDATE "positions" 
            SET "is_active" = true, 
                "created_at" = now(), 
                "updated_at" = now()
            WHERE "is_active" IS NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_SUB_TEAM_NAME_TEAM"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_POSITION_NAME"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_TEAM_NAME"`);

        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_sub_team_id"`);
        await queryRunner.query(`ALTER TABLE "sub_teams" DROP CONSTRAINT IF EXISTS "FK_sub_teams_team_id"`);

        // Remove sub_team_id from users table
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "sub_team_id"`);

        // Drop sub_teams table
        await queryRunner.query(`DROP TABLE IF EXISTS "sub_teams"`);

        // Remove new columns from positions table
        await queryRunner.query(`
            ALTER TABLE "positions" 
            DROP COLUMN IF EXISTS "description",
            DROP COLUMN IF EXISTS "is_active",
            DROP COLUMN IF EXISTS "created_at",
            DROP COLUMN IF EXISTS "updated_at",
            DROP COLUMN IF EXISTS "deleted_at"
        `);

        // Remove new columns from teams table
        await queryRunner.query(`
            ALTER TABLE "teams" 
            DROP COLUMN IF EXISTS "description",
            DROP COLUMN IF EXISTS "is_active",
            DROP COLUMN IF EXISTS "created_at",
            DROP COLUMN IF EXISTS "updated_at",
            DROP COLUMN IF EXISTS "deleted_at"
        `);

        // Restore old unique constraints
        await queryRunner.query(`
            ALTER TABLE "teams" 
            ADD CONSTRAINT "UQ_teams_name" UNIQUE ("name")
        `);
        
        await queryRunner.query(`
            ALTER TABLE "positions" 
            ADD CONSTRAINT "UQ_positions_name" UNIQUE ("name")
        `);
    }
}