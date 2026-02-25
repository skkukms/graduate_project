
-- db생성
-- CREATE DATABASE stock DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_0900_ai_ci;


-- TODO: 테이블 초안에 자세한 컬럼 설정 및 테이블 구조 확정
USE stock;

CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(80) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2) 계좌(유저당 1개) : 현금 스냅샷
CREATE TABLE accounts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,         
  cash_balance DECIMAL(18,2) NOT NULL DEFAULT 10000000.00, 
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_accounts_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3) 종목 마스터(한국주식)
CREATE TABLE symbols (
  code VARCHAR(12) PRIMARY KEY,                    -- 005930
  name VARCHAR(120) NOT NULL,                      -- 삼성전자
  market ENUM('KOSPI','KOSDAQ','KONEX','ETF','ETN','OTHER') NOT NULL DEFAULT 'KOSPI',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_symbols_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4) 가격 캐시(현재가/종가 저장용) : "가장 최근 값"만 써도 되고 시계열로 쌓아도 됨
CREATE TABLE price_quotes (
  symbol_code VARCHAR(12) NOT NULL,
  as_of DATETIME NOT NULL,                         -- 가격 기준 시각
  price DECIMAL(18,2) NOT NULL,
  source VARCHAR(40) NOT NULL DEFAULT 'manual',
  PRIMARY KEY (symbol_code, as_of),
  INDEX idx_quotes_asof (as_of),
  CONSTRAINT fk_quotes_symbol
    FOREIGN KEY (symbol_code) REFERENCES symbols(code) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5) 주문(매수/매도 요청) : 로그
CREATE TABLE orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  account_id BIGINT UNSIGNED NOT NULL,
  symbol_code VARCHAR(12) NOT NULL,
  side ENUM('BUY','SELL') NOT NULL,
  order_type ENUM('MARKET','LIMIT') NOT NULL DEFAULT 'MARKET',
  status ENUM('NEW','FILLED','CANCELLED','REJECTED') NOT NULL DEFAULT 'NEW',
  requested_qty INT UNSIGNED NOT NULL,
  limit_price DECIMAL(18,2) NULL,                  -- LIMIT일 때만
  filled_qty INT UNSIGNED NOT NULL DEFAULT 0,
  avg_fill_price DECIMAL(18,2) NULL,
  fee DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  reason VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_orders_account_time (account_id, created_at),
  INDEX idx_orders_symbol_time (symbol_code, created_at),
  CONSTRAINT fk_orders_account
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_orders_symbol
    FOREIGN KEY (symbol_code) REFERENCES symbols(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6) 체결(실제로 체결된 내역) : 주문 1개가 여러 번 체결될 수 있게 확장
CREATE TABLE trades (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  executed_qty INT UNSIGNED NOT NULL,
  executed_price DECIMAL(18,2) NOT NULL,
  fee DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  executed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_trades_order (order_id),
  INDEX idx_trades_time (executed_at),
  CONSTRAINT fk_trades_order
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7) 현재 보유(스냅샷) : 계좌-종목당 1줄
CREATE TABLE positions (
  account_id BIGINT UNSIGNED NOT NULL,
  symbol_code VARCHAR(12) NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 0,
  avg_price DECIMAL(18,2) NULL,                    -- 평단
  realized_pnl DECIMAL(18,2) NOT NULL DEFAULT 0.00, -- 실현손익(선택)
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (account_id, symbol_code),
  INDEX idx_positions_symbol (symbol_code),
  CONSTRAINT fk_positions_account
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_positions_symbol
    FOREIGN KEY (symbol_code) REFERENCES symbols(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =========================
-- (선택) 관심종목
-- =========================
CREATE TABLE watchlists (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  account_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(60) NOT NULL DEFAULT 'default',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_watchlist_name (account_id, name),
  CONSTRAINT fk_watchlists_account
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE watchlist_items (
  watchlist_id BIGINT UNSIGNED NOT NULL,
  symbol_code VARCHAR(12) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (watchlist_id, symbol_code),
  CONSTRAINT fk_wli_watchlist
    FOREIGN KEY (watchlist_id) REFERENCES watchlists(id) ON DELETE CASCADE,
  CONSTRAINT fk_wli_symbol
    FOREIGN KEY (symbol_code) REFERENCES symbols(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;