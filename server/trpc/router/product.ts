import { randomUUID } from "crypto";
import { z } from "zod";
import { postgresQuery } from "../../database/db";
import { protectedProcedure, publicProcedure, router } from "../../utils/trpc";
import { TRPCError } from "@trpc/server";

const MAX_FILE_SIZE = 500000000000;
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
export const createProductSchema = z.object({
  product_name: z.string().min(1).max(255),
  product_description: z.string().optional(),
  price: z.number().min(0),
  quantity: z.number().min(0),
  product_image: z.string().optional(),
});

export type createProductSchemaType = z.infer<typeof createProductSchema>;

export const productRouter = router({
  create: publicProcedure
    .input(createProductSchema)
    .mutation(async ({ input, ctx }) => {
      const {
        product_name,
        product_description,
        price,
        product_image,
        quantity,
      } = input;

      const product = await postgresQuery(
        `INSERT INTO "PRODUCT" ("product_id","product_name", "product_description", "price", "product_image", "createdBy") VALUES ($1, $2, $3, $4, $5, $6) RETURNING "PRODUCT"."product_id"`,
        [
          randomUUID(),
          product_name,
          product_description,
          price,
          product_image,
          ctx.session?.user?.employee_id,
        ]
      );

      // get employee postoffice location
      const employeePostofficeLocation = await postgresQuery(
        `SELECT "postoffice_location_id" FROM "WORKS_FOR" WHERE "employee_id" = $1`,
        [ctx.session?.user?.employee_id]
      );

      const productInventory = await postgresQuery(
        `INSERT INTO "PRODUCT_INVENTORY" ("product_id", "postoffice_location_id", "quantity") VALUES ($1, $2, $3)`,
        [
          product.rows[0].product_id,
          employeePostofficeLocation.rows[0].postoffice_location_id,
          quantity,
        ]
      );

      return {
        status: "success",
        message: "Product created successfully",
        product: {
          product_id: product.rows[0].product_id,
        },
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        product_id: z.string(),
        product_name: z.string().min(1).max(255),
        product_description: z.string().optional(),
        price: z.number().min(0),
        quantity: z.number().min(0),
        product_image: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const {
        product_id,
        product_name,
        product_description,
        price,
        product_image,
        quantity,
      } = input;

      const product = await postgresQuery(
        `UPDATE "PRODUCT" SET "product_name" = $1, "product_description" = $2, "price" = $3, "product_image" = $4 WHERE "product_id" = $5 RETURNING "PRODUCT"."product_id"`,
        [product_name, product_description, price, product_image, product_id]
      );

      // get employee postoffice location
      const employeePostofficeLocation = await postgresQuery(
        `SELECT "postoffice_location_id" FROM "WORKS_FOR" WHERE "employee_id" = $1`,
        [ctx.session?.user?.employee_id]
      );

      const productInventory = await postgresQuery(
        `UPDATE "PRODUCT_INVENTORY" SET "quantity" = $1 WHERE "product_id" = $2 AND "postoffice_location_id" = $3`,
        [
          quantity,
          product_id,
          employeePostofficeLocation.rows[0].postoffice_location_id,
        ]
      );

      return {
        status: "success",
        message: "Product updated successfully",
        product: {
          product_id: product.rows[0].product_id,
        },
      };
    }),

  delete: protectedProcedure
    .input(z.object({ product_id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { product_id } = input;

      const product = await postgresQuery(
        `DELETE FROM "PRODUCT" WHERE "product_id" = $1 RETURNING "PRODUCT"."product_id"`,
        [product_id]
      );

      // get employee postoffice location
      const employeePostofficeLocation = await postgresQuery(
        `SELECT "postoffice_location_id" FROM "WORKS_FOR" WHERE "employee_id" = $1`,
        [ctx.session?.user?.employee_id]
      );

      const productInventory = await postgresQuery(
        `DELETE FROM "PRODUCT_INVENTORY" WHERE "product_id" = $1 AND "postoffice_location_id" = $2`,
        [product_id, employeePostofficeLocation.rows[0].postoffice_location_id]
      );

      return {
        status: "success",
        message: "Product deleted successfully",
        product: {
          product_id: product.rows[0].product_id,
        },
      };
    }),

  getOneProduct: publicProcedure
    .input(z.object({ product_id: z.string() }))
    .query(async ({ input, ctx }) => {
      const { product_id } = input;

      const managerLocation = await postgresQuery(
        `SELECT "postoffice_location_id" FROM "WORKS_FOR" WHERE "employee_id" = $1`,
        [ctx.session?.user?.employee_id]
      );

      const product = await postgresQuery(
        `SELECT 
        P.product_id, 
        P.product_name, 
        P.product_description, 
        P.price, 
        P.product_image, 
        PI.quantity AS available_quantity
        FROM 
            "PRODUCT" P
        JOIN 
            "PRODUCT_INVENTORY" PI ON P.product_id = PI.product_id
        WHERE 
            PI.postoffice_location_id = $1 AND
            P.product_id = $2
        LIMIT 1;`,
        [managerLocation.rows[0].postoffice_location_id, product_id]
      );

      if (product.rows.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }
      return {
        status: "success",
        product: product.rows[0],
      };
    }),

  getAllProducts: publicProcedure
    .input(
      z.object({
        locationId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const getAllProductsAtLocation = await postgresQuery(
        `SELECT 
          P.product_id, 
          P.product_name, 
          P.product_description, 
          P.price, 
          P.product_image, 
          PI.quantity AS available_quantity
        FROM 
          "PRODUCT" P
        JOIN 
          "PRODUCT_INVENTORY" PI ON P.product_id = PI.product_id
        WHERE 
          PI.postoffice_location_id = $1
        ORDER BY 
          P.product_name;
          `,
        [input.locationId]
      );

      return {
        status: "success",
        products: getAllProductsAtLocation.rows as getProductWithQuantity[],
      };
    }),

  createOrder: protectedProcedure
    .input(
      z.object({
        products: z.array(
          z.object({
            product_id: z.string(),
            quantity: z.number().min(1),
            price: z.number().min(0),
          })
        ),
        postoffice_location_id: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { products, postoffice_location_id } = input;

      const order = await postgresQuery(
        `INSERT INTO "ORDER" ("customer_id", "postoffice_location_id", "total_price") VALUES ($1, $2, $3) RETURNING "ORDER"."order_id"`,
        [
          ctx.session?.user?.customer_id,
          postoffice_location_id,
          input.products.reduce(
            (acc, product) => acc + product.quantity * product.price,
            0
          ),
        ]
      );

      const order_id = order.rows[0].order_id;

      const orderProducts = products.map(async (product) => {
        const orderProduct = await postgresQuery(
          `INSERT INTO "ORDER_ITEMS" ("order_id", "product_id", "quantity", "price") VALUES ($1, $2, $3, $4) RETURNING "ORDER_ITEMS"."order_item_id"`,
          [order_id, product.product_id, product.quantity, product.price]
        );
      });

      const updateInventory = products.map(async (product) => {
        const inventory = await postgresQuery(
          `UPDATE "PRODUCT_INVENTORY" SET "quantity" = "quantity" - $1 WHERE "product_id" = $2 AND "postoffice_location_id" = $3`,
          [product.quantity, product.product_id, postoffice_location_id]
        );
      });

      await Promise.all(orderProducts);

      await Promise.all(updateInventory);

      return {
        status: "success",
        message: "Order created successfully",
        order: {
          order_id,
        },
      };
    }),
});

export interface getProductWithQuantity {
  product_id: string;
  product_name: string;
  product_description: string;
  price: number;
  product_image: string;
  available_quantity: number;
}