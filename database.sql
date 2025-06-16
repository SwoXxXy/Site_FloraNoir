USE [master]
GO
IF DB_ID('FloraNoir') IS NOT NULL
BEGIN
    ALTER DATABASE [FloraNoir] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE [FloraNoir];
END
GO

CREATE DATABASE [FloraNoir]
 CONTAINMENT = NONE
 ON  PRIMARY 
( NAME = N'FloraNoir', FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL16.MSSQLSERVER\MSSQL\DATA\FloraNoir.mdf', SIZE = 8192KB , MAXSIZE = UNLIMITED, FILEGROWTH = 65536KB )
 LOG ON 
( NAME = N'FloraNoir_log', FILENAME = N'C:\Program Files\Microsoft SQL Server\MSSQL16.MSSQLSERVER\MSSQL\DATA\FloraNoir_log.ldf', SIZE = 8192KB , MAXSIZE = 2048GB , FILEGROWTH = 65536KB )
GO

USE [FloraNoir]
GO

-- Таблица Users
CREATE TABLE [dbo].[Users](
  [id_user] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [username] NVARCHAR(50) NOT NULL UNIQUE,
  [password] NVARCHAR(255) NOT NULL,
  [email] NVARCHAR(100) NOT NULL UNIQUE,
  [role] NVARCHAR(20) NULL DEFAULT 'user',
  [created_at] DATETIME DEFAULT GETDATE()
);
GO

-- Таблица Klients
CREATE TABLE [dbo].[Klients](
  [id_klient] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [FIO] NVARCHAR(100),
  [phone] NVARCHAR(20),
  [email] NVARCHAR(100) UNIQUE,
  [date_registration] DATETIME DEFAULT GETDATE(),
  [user_id] INT,
  CONSTRAINT FK_Klients_Users FOREIGN KEY (user_id) REFERENCES [dbo].[Users]([id_user])
    ON UPDATE CASCADE ON DELETE SET NULL
);
GO

-- Таблица Products
CREATE TABLE [dbo].[Products](
  [id_products] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [title] NVARCHAR(255) NOT NULL,
  [price] DECIMAL(10, 2) NOT NULL,
  [img] NVARCHAR(MAX) NOT NULL,
  [type] NVARCHAR(50) NOT NULL,
  [occasion] NVARCHAR(50),
  [stock] INT NOT NULL,
  [description] NVARCHAR(MAX) NOT NULL,
  [composition] NVARCHAR(MAX),
  [care] NVARCHAR(MAX)
);
GO

-- Таблица Orders
CREATE TABLE [dbo].[Orders](
  [id_order] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [date_order] DATETIME DEFAULT GETDATE(),
  [total_sum] DECIMAL(10, 2),
  [status_order] NVARCHAR(50),
  [client_id] INT,
  CONSTRAINT FK_Orders_Klients FOREIGN KEY (client_id) REFERENCES [dbo].[Klients]([id_klient])
    ON UPDATE CASCADE ON DELETE SET NULL
);
GO

-- Таблица Reviews (исправлено: productId → product_id)
CREATE TABLE [dbo].[Reviews](
  [id] INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
  [product_id] INT NOT NULL,
  [author] NVARCHAR(100) NOT NULL,
  [rating] INT NOT NULL,
  [date] DATETIME NOT NULL DEFAULT GETDATE(),
  [text] NVARCHAR(MAX) NOT NULL,
  [user_id] INT,
  CONSTRAINT FK_Reviews_Products FOREIGN KEY (product_id) REFERENCES [dbo].[Products]([id_products])
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT FK_Reviews_Users FOREIGN KEY (user_id) REFERENCES [dbo].[Users]([id_user])
    ON UPDATE CASCADE ON DELETE SET NULL
);
GO
