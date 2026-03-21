-- db생성
-- CREATE DATABASE stock DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE stock;

-- =====================================================
-- 테이블 구성 (6개)
-- users → accounts → symbols → orders → positions → watchlist_items
-- price_quotes, trades 제거 (모의투자 범위에서 불필요)
-- =====================================================


-- 1) 회원
CREATE TABLE users (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  name          VARCHAR(80)   NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 2) 계좌 (유저당 1개 / 초기 잔고 1,000만원)
CREATE TABLE accounts (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT UNSIGNED NOT NULL UNIQUE,
  cash_balance  DECIMAL(18,2)  NOT NULL DEFAULT 10000000.00,
  created_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_accounts_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 3) 종목 마스터
--    실시간 시세는 Finnhub / KRX API에서 직접 조회하므로 여기서는 메타 정보만 보관
CREATE TABLE symbols (
  code       VARCHAR(12)  PRIMARY KEY,           -- 005930 / AAPL 등
  name       VARCHAR(120) NOT NULL,              -- 삼성전자 / Apple Inc.
  market     ENUM('KOSPI','KOSDAQ','ETF','US','OTHER') NOT NULL DEFAULT 'KOSPI',
  is_active  TINYINT(1)   NOT NULL DEFAULT 1,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_symbols_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 4) 주문 / 체결 통합 로그
--    모의투자 특성상 주문은 즉시 전량 체결 → trades 테이블 별도 불필요
--    status = FILLED 시 avg_fill_price 에 체결가 기록
CREATE TABLE orders (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  account_id     BIGINT UNSIGNED NOT NULL,
  symbol_code    VARCHAR(12)     NOT NULL,
  side           ENUM('BUY','SELL')                          NOT NULL,
  status         ENUM('FILLED','CANCELLED','REJECTED')       NOT NULL DEFAULT 'FILLED',
  qty            INT UNSIGNED    NOT NULL,                   -- 주문 수량
  fill_price     DECIMAL(18,2)   NOT NULL,                   -- 체결가 (모의투자: 주문 시점 현재가)
  fee            DECIMAL(18,2)   NOT NULL DEFAULT 0.00,      -- 수수료 (필요 시 계산)
  note           VARCHAR(255)    NULL,                       -- 취소/거부 사유 등
  created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_orders_account_time (account_id, created_at),
  INDEX idx_orders_symbol_time  (symbol_code, created_at),
  CONSTRAINT fk_orders_account
    FOREIGN KEY (account_id)  REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_orders_symbol
    FOREIGN KEY (symbol_code) REFERENCES symbols(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 5) 현재 보유 포지션 (계좌-종목당 1줄)
--    매수/매도 시 애플리케이션 레이어에서 갱신
CREATE TABLE positions (
  account_id    BIGINT UNSIGNED NOT NULL,
  symbol_code   VARCHAR(12)     NOT NULL,
  quantity      INT UNSIGNED    NOT NULL DEFAULT 0,
  avg_price     DECIMAL(18,2)   NOT NULL DEFAULT 0.00,  -- 평균 매수단가
  realized_pnl  DECIMAL(18,2)   NOT NULL DEFAULT 0.00,  -- 누적 실현손익
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (account_id, symbol_code),
  INDEX idx_positions_symbol (symbol_code),
  CONSTRAINT fk_positions_account
    FOREIGN KEY (account_id)  REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_positions_symbol
    FOREIGN KEY (symbol_code) REFERENCES symbols(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 6) 관심종목
--    관심목록 그룹 기능 없이 계좌당 단일 리스트로 단순화
CREATE TABLE watchlist_items (
  account_id   BIGINT UNSIGNED NOT NULL,
  symbol_code  VARCHAR(12)     NOT NULL,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (account_id, symbol_code),
  CONSTRAINT fk_wli_account
    FOREIGN KEY (account_id)  REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_wli_symbol
    FOREIGN KEY (symbol_code) REFERENCES symbols(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
