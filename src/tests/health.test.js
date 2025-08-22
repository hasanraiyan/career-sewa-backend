import request from "supertest";
import app from "../server.js";

describe("Health Monitoring Endpoints", () => {
  describe("GET /health", () => {
    it("should return basic health status", async () => {
      const response = await request(app)
        .get("/health")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("status", "OK");
      expect(response.body.data).toHaveProperty("service", "career-sewa-api");
      expect(response.body.data).toHaveProperty("environment");
      expect(response.body.data).toHaveProperty("uptime");
      expect(response.body.data).toHaveProperty("timestamp");
    });
  });

  describe("GET /health/detailed", () => {
    it("should return detailed health status", async () => {
      const response = await request(app)
        .get("/health/detailed")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("status");
      expect(response.body.data).toHaveProperty("service", "career-sewa-api");
      expect(response.body.data).toHaveProperty("responseTime");
      expect(response.body.data).toHaveProperty("checks");
      
      const { checks } = response.body.data;
      expect(checks).toHaveProperty("application");
      expect(checks).toHaveProperty("database");
      expect(checks).toHaveProperty("memory");
      expect(checks).toHaveProperty("cpu");
      expect(checks).toHaveProperty("environment");
      expect(checks).toHaveProperty("dependencies");

      // Application check
      expect(checks.application).toHaveProperty("status");
      expect(checks.application).toHaveProperty("name", "career-sewa-api");
      expect(checks.application).toHaveProperty("version");
      expect(checks.application).toHaveProperty("environment");
      expect(checks.application).toHaveProperty("nodeVersion");
      expect(checks.application).toHaveProperty("uptime");

      // Memory check
      expect(checks.memory).toHaveProperty("status");
      expect(checks.memory).toHaveProperty("usage");
      expect(checks.memory.usage).toHaveProperty("rss");
      expect(checks.memory.usage).toHaveProperty("heapTotal");
      expect(checks.memory.usage).toHaveProperty("heapUsed");
      expect(checks.memory).toHaveProperty("heapUsagePercentage");

      // Environment check
      expect(checks.environment).toHaveProperty("status");
      expect(checks.environment).toHaveProperty("requiredVariables");
      expect(checks.environment.requiredVariables).toHaveProperty("NODE_ENV");
      expect(checks.environment.requiredVariables).toHaveProperty("PORT");
      expect(checks.environment.requiredVariables).toHaveProperty("MONGODB_URI");
    });
  });

  describe("GET /health/liveness", () => {
    it("should return liveness status", async () => {
      const response = await request(app)
        .get("/health/liveness")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("alive", true);
      expect(response.body.data).toHaveProperty("uptime");
      expect(response.body.data).toHaveProperty("timestamp");
    });
  });

  describe("GET /health/readiness", () => {
    it("should return readiness status", async () => {
      const response = await request(app)
        .get("/health/readiness");

      // Can be either 200 (ready) or 503 (not ready) depending on DB connection
      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty("success");
      expect(response.body.data).toHaveProperty("ready");
      expect(response.body.data).toHaveProperty("timestamp");
    });
  });

  describe("GET /health/metrics", () => {
    it("should return Prometheus metrics", async () => {
      const response = await request(app)
        .get("/health/metrics")
        .expect(200);

      expect(response.headers["content-type"]).toBe("text/plain; charset=utf-8");
      expect(response.text).toContain("career_sewa_uptime_seconds");
      expect(response.text).toContain("career_sewa_memory_usage_bytes");
      expect(response.text).toContain("career_sewa_database_status");
      expect(response.text).toContain("# HELP");
      expect(response.text).toContain("# TYPE");
    });
  });

  describe("Error handling", () => {
    it("should handle health check errors gracefully", async () => {
      // This test would require mocking dependencies to simulate failures
      // For now, we'll just ensure the endpoints don't crash
      await request(app).get("/health").expect(200);
      await request(app).get("/health/detailed").expect((res) => {
        expect([200, 207]).toContain(res.status);
      });
      await request(app).get("/health/liveness").expect(200);
    });
  });
});