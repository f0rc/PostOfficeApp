
CREATE TABLE "Example" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Example_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Company"{
"address" address,
"totalPostOfficeLocations" INTEGER NOT NULL,
"totalEmployees" INTEGER NOT NULL,
"totalCustomer" INTEGER NOT NULL,
"totalRevenue" INTEGER NOT NULL,
"totalPaidSalary" INTEGER NOT NULL,
"profit" INTEGER NOT NULL,
"createdAt" DATE NOT NULL, 
"updatedAt" DATE NOT NULL
};


CREATE TABLE "Users" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,  
    "firstName" VARCHAR(30) NOT NULL,
    "lastName" VARCHAR(30) NOT NULL,
    "birthDate" DATE NOT NULL,
    "revenue" INTEGER NOT NULL CHECK (revenue >= 0),
    "role" TEXT CHECK (role == 'Manager' || role == 'Clerk'),
    "salary" INT NOT NULL CHECK (salary >= 0),
    "numberOfPackages" INT NOT NULL CHECK ('numberOfPackages' >= 0),
    "address" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" VARCHAR(30) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" VARCHAR(30) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Work_For" (
    "hours" int NOT NULL
);

CREATE TABLE "customerAccount" (
    "customerID" TEXT NOT NULL,
    "firstName" VARCHAR(30) NOT NULL,
    "lastName" VARCHAR(30) NOT NULL,
    "address" ADDRESS NOT NULL,
    "updatedAt" Date NOT NULL,
    "updatedBy" VARCHAR(30) NOT NULL,
    "createdAt" DATE NOT NULL,

    CONSTRAINT "customerAccount_pkey" PRIMARY KEY ("customerID")
);

CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Sessions"("sessionToken");

CREATE UNIQUE INDEX "User_email_key" ON "Users"("email");

ALTER TABLE "Sessions" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- trigger function to update the updatedAt column on update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- trigger for the Example table
CREATE TRIGGER update_example_updated_at BEFORE UPDATE ON "Example" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- create trigger for the User table
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "Users" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
