/*
================================================================================
MSSQL Database Setup Script - CodingPortfolio
================================================================================
Purpose: Creates the CodingPortfolio database and required tables for the
         Guess the Number game.

Instructions:
1. Connect to your SQL Server instance using SSMS or Azure Data Studio
2. Execute this script in the master database context
3. Verify database creation by refreshing the Databases folder

Author: Development Team
Date: 2024
================================================================================
*/

-- =============================================================================
-- SECTION 1: Database Creation
-- =============================================================================

-- Defensive: Check if database exists before creating
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'CodingPortfolio')
BEGIN
    CREATE DATABASE CodingPortfolio;
    PRINT 'Database CodingPortfolio created successfully.';
END
ELSE
BEGIN
    PRINT 'Database CodingPortfolio already exists.';
END
GO

-- Switch to the CodingPortfolio database
USE CodingPortfolio;
GO

-- =============================================================================
-- SECTION 2: Table Creation - GameResults
-- =============================================================================

-- Defensive: Check if table exists before creating
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[GameResults]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[GameResults]
    (
        -- Primary Key
        [Id]            INT IDENTITY(1,1)   NOT NULL,
        
        -- Game Information
        [GameName]      NVARCHAR(100)       NOT NULL,
        [Attempts]      INT                 NOT NULL,
        [Won]           BIT                 NOT NULL DEFAULT 0,
        
        -- Timestamps
        [PlayedAt]      DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        [CreatedAt]     DATETIME2           NOT NULL DEFAULT GETUTCDATE(),
        
        -- Constraints
        CONSTRAINT [PK_GameResults] PRIMARY KEY CLUSTERED ([Id] ASC),
        CONSTRAINT [CK_GameResults_Attempts] CHECK ([Attempts] > 0 AND [Attempts] <= 1000),
        CONSTRAINT [CK_GameResults_GameName] CHECK (LEN([GameName]) > 0)
    );
    
    PRINT 'Table GameResults created successfully.';
END
ELSE
BEGIN
    PRINT 'Table GameResults already exists.';
END
GO

-- =============================================================================
-- SECTION 3: Indexes for Performance
-- =============================================================================

-- Index for querying by game name (common query pattern)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_GameResults_GameName' AND object_id = OBJECT_ID(N'[dbo].[GameResults]'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_GameResults_GameName]
    ON [dbo].[GameResults] ([GameName])
    INCLUDE ([Attempts], [Won], [PlayedAt]);
    
    PRINT 'Index IX_GameResults_GameName created successfully.';
END
GO

-- Index for date-based queries
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = N'IX_GameResults_PlayedAt' AND object_id = OBJECT_ID(N'[dbo].[GameResults]'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_GameResults_PlayedAt]
    ON [dbo].[GameResults] ([PlayedAt] DESC)
    INCLUDE ([GameName], [Attempts], [Won]);
    
    PRINT 'Index IX_GameResults_PlayedAt created successfully.';
END
GO

-- =============================================================================
-- SECTION 4: Stored Procedures
-- =============================================================================

-- Procedure: Insert Game Result
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[usp_InsertGameResult]') AND type in (N'P'))
BEGIN
    DROP PROCEDURE [dbo].[usp_InsertGameResult];
END
GO

CREATE PROCEDURE [dbo].[usp_InsertGameResult]
    @GameName   NVARCHAR(100),
    @Attempts   INT,
    @Won        BIT,
    @PlayedAt   DATETIME2 = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Defensive: Validate inputs
    IF @GameName IS NULL OR LEN(TRIM(@GameName)) = 0
    BEGIN
        RAISERROR('GameName cannot be null or empty', 16, 1);
        RETURN -1;
    END
    
    IF @Attempts <= 0 OR @Attempts > 1000
    BEGIN
        RAISERROR('Attempts must be between 1 and 1000', 16, 1);
        RETURN -1;
    END
    
    -- Default PlayedAt to current UTC time if not provided
    IF @PlayedAt IS NULL
        SET @PlayedAt = GETUTCDATE();
    
    -- Insert the record
    INSERT INTO [dbo].[GameResults] ([GameName], [Attempts], [Won], [PlayedAt])
    VALUES (@GameName, @Attempts, @Won, @PlayedAt);
    
    -- Return the new record ID
    SELECT SCOPE_IDENTITY() AS NewId;
    
    RETURN 0;
END
GO

PRINT 'Stored procedure usp_InsertGameResult created successfully.';
GO

-- Procedure: Get Game Statistics
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[usp_GetGameStats]') AND type in (N'P'))
BEGIN
    DROP PROCEDURE [dbo].[usp_GetGameStats];
END
GO

CREATE PROCEDURE [dbo].[usp_GetGameStats]
    @GameName NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Defensive: Validate input
    IF @GameName IS NULL OR LEN(TRIM(@GameName)) = 0
    BEGIN
        RAISERROR('GameName cannot be null or empty', 16, 1);
        RETURN -1;
    END
    
    SELECT 
        @GameName AS GameName,
        COUNT(*) AS TotalGames,
        SUM(CASE WHEN Won = 1 THEN 1 ELSE 0 END) AS GamesWon,
        AVG(CAST(Attempts AS FLOAT)) AS AvgAttempts,
        MIN(CASE WHEN Won = 1 THEN Attempts ELSE NULL END) AS BestScore,
        MAX(CASE WHEN Won = 1 THEN Attempts ELSE NULL END) AS WorstScore
    FROM [dbo].[GameResults]
    WHERE GameName = @GameName;
    
    RETURN 0;
END
GO

PRINT 'Stored procedure usp_GetGameStats created successfully.';
GO

-- =============================================================================
-- SECTION 5: Sample Data (Optional - Comment out in production)
-- =============================================================================

/*
-- Uncomment to insert sample data for testing
INSERT INTO [dbo].[GameResults] ([GameName], [Attempts], [Won], [PlayedAt])
VALUES 
    ('GuessTheNumber', 5, 1, DATEADD(DAY, -7, GETUTCDATE())),
    ('GuessTheNumber', 8, 1, DATEADD(DAY, -6, GETUTCDATE())),
    ('GuessTheNumber', 3, 1, DATEADD(DAY, -5, GETUTCDATE())),
    ('GuessTheNumber', 12, 1, DATEADD(DAY, -4, GETUTCDATE())),
    ('GuessTheNumber', 7, 1, DATEADD(DAY, -3, GETUTCDATE()));

PRINT 'Sample data inserted successfully.';
*/

-- =============================================================================
-- SECTION 6: Verification Queries
-- =============================================================================

-- Verify database structure
PRINT '';
PRINT '=== Database Structure Verification ===';
PRINT '';

SELECT 
    t.name AS TableName,
    c.name AS ColumnName,
    ty.name AS DataType,
    c.max_length AS MaxLength,
    c.is_nullable AS IsNullable
FROM sys.tables t
INNER JOIN sys.columns c ON t.object_id = c.object_id
INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
WHERE t.name = 'GameResults'
ORDER BY c.column_id;

PRINT '';
PRINT '=== Setup Complete ===';
PRINT 'Database: CodingPortfolio';
PRINT 'Table: GameResults';
PRINT '';
GO
