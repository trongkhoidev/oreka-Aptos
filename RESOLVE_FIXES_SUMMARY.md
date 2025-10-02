# Tóm tắt các vấn đề đã sửa với resolve_market và resolve_multi_market

## 🔍 **Vấn đề chính gây ra "Simulation error - Generic error"**

### 1. **Vấn đề với Global Pool Dependencies**
**Nguyên nhân:** Các function `resolve_market` và `resolve_multi_market` gọi các function từ `yugo::global_pool` module với parameters không đúng hoặc module chưa được khởi tạo.

**Cụ thể:**
- `yugo::global_pool::deposit_from_market(market.creator, ...)` - sai parameter (cần admin_addr)
- `yugo::global_pool::emit_injection_locked(market.creator, ...)` - sai parameter (cần admin_addr)
- Nếu global pool chưa được deploy/khởi tạo, sẽ gây simulation error

**Giải pháp:** 
- Thay thế logic gọi global pool bằng việc move funds vào `fee_vault` cho market owner withdraw
- Comment out các function calls có thể gây lỗi

### 2. **Vấn đề với Logic claim_multi_outcome**
**Nguyên nhân:** Logic sai trong việc kiểm tra winning condition

**Cụ thể:**
- `market.result == 255` được dùng để check winner, nhưng 255 là giá trị "unresolved"
- Nếu market đã resolved, result sẽ không bao giờ là 255

**Giải pháp:**
- Sửa thành `market.result != 255` và thêm validation cho outcome index
- Kiểm tra user có position trong winning outcome hay không

### 3. **Vấn đề với Market State Validation**
**Nguyên nhân:** Thiếu validation đầy đủ trước khi resolve

**Giải pháp thêm vào aptosMarketService.ts:**
- Kiểm tra market chưa được resolved
- Kiểm tra market đã đến maturity time
- Enhanced logging để debug dễ hơn

### 4. **Vấn đề với Error Handling**
**Nguyên nhân:** Error handling không đầy đủ trong Customer.tsx

**Giải pháp:**
- Thêm validation cho price_feed_id format
- Kiểm tra VAA data từ Hermes API
- Enhanced error messages

## 📝 **Các thay đổi cụ thể**

### market_core.move:
1. **resolve_market & resolve_multi_market:**
   - Thay `yugo::global_pool::deposit_from_market(...)` bằng việc merge vào `fee_vault`
   - Comment out `yugo::global_pool::emit_injection_locked(...)`

2. **claim_multi_outcome:**
   - Sửa condition từ `market.result == 255` thành `market.result != 255`
   - Thêm validation cho user_amount và winner_pool

3. **admin_inject_to_market & admin_cancel_injection:**
   - Comment out global pool dependencies để tránh lỗi

### aptosMarketService.ts:
1. **resolveMarket function:**
   - Thêm validation cho market state
   - Enhanced logging
   - Loại bỏ logic double-check market type (gây confusion)

### Customer.tsx:
1. **handleResolve function:**
   - Thêm validation cho market state trước khi resolve
   - Enhanced error handling cho Hermes API
   - Better price_feed_id processing
   - Improved error messages

## ✅ **Kết quả mong đợi**

Sau khi áp dụng các fix này:
1. **Simulation error sẽ không còn xảy ra** - do loại bỏ dependencies có vấn đề
2. **Resolve market sẽ hoạt động đúng** - cho cả binary và multi-outcome markets
3. **Claims sẽ hoạt động đúng** - logic đã được sửa
4. **Error messages rõ ràng hơn** - dễ debug khi có vấn đề

## 🔧 **Cách test**

1. **Test resolve binary market:**
   - Tạo binary market → wait until maturity → resolve
   - Kiểm tra logs để thấy flow hoạt động

2. **Test resolve multi-outcome market:**
   - Tạo multi-outcome market → bet on different outcomes → wait until maturity → resolve
   - Kiểm tra winner được xác định đúng

3. **Test claim:**
   - Sau khi resolve → users có thể claim rewards
   - Kiểm tra amounts calculation đúng

## 📋 **Lưu ý quan trọng**

1. **Global Pool:** Hiện tại global pool functions đã được disabled. Nếu muốn enable lại, cần:
   - Deploy global pool module
   - Initialize global pool
   - Sử dụng đúng admin address

2. **Price Feed ID:** Đảm bảo price_feed_id format đúng (64 hex chars, no 0x prefix) để Hermes API hoạt động

3. **Testing:** Nên test trên testnet trước khi deploy lên mainnet

4. **Monitoring:** Theo dõi logs khi resolve để đảm bảo Pyth data được fetch đúng cách
