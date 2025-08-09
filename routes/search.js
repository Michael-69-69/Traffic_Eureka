const express = require('express');
const router = express.Router();

// Function to normalize Vietnamese diacritics for search
function normalizeVietnamese(str) {
    return str
        .normalize('NFD') // Decompose diacritics
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase();
}

// Enhanced Ho Chi Minh City places database with accurate coordinates and Vietnamese names
const vietnamPlaces = {
    // Districts in HCMC
    'district 1': { lat: 10.774389, lng: 106.699172, type: 'district', fullName: 'District 1, Ho Chi Minh City', vietnameseName: 'Quận 1' },
    'district 2': { lat: 10.803003, lng: 106.751150, type: 'district', fullName: 'District 2, Ho Chi Minh City', vietnameseName: 'Quận 2' },
    'district 3': { lat: 10.783139, lng: 106.686991, type: 'district', fullName: 'District 3, Ho Chi Minh City', vietnameseName: 'Quận 3' },
    'district 4': { lat: 10.759068, lng: 106.704124, type: 'district', fullName: 'District 4, Ho Chi Minh City', vietnameseName: 'Quận 4' },
    'district 5': { lat: 10.754181, lng: 106.663836, type: 'district', fullName: 'District 5, Ho Chi Minh City', vietnameseName: 'Quận 5' },
    'district 6': { lat: 10.746947, lng: 106.634687, type: 'district', fullName: 'District 6, Ho Chi Minh City', vietnameseName: 'Quận 6' },
    'district 7': { lat: 10.741638, lng: 106.714672, type: 'district', fullName: 'District 7, Ho Chi Minh City', vietnameseName: 'Quận 7' },
    'district 8': { lat: 10.740370, lng: 106.665951, type: 'district', fullName: 'District 8, Ho Chi Minh City', vietnameseName: 'Quận 8' },
    'district 10': { lat: 10.771151, lng: 106.669789, type: 'district', fullName: 'District 10, Ho Chi Minh City', vietnameseName: 'Quận 10' },
    'district 11': { lat: 10.763052, lng: 106.643825, type: 'district', fullName: 'District 11, Ho Chi Minh City', vietnameseName: 'Quận 11' },
    'district 12': { lat: 10.867123, lng: 106.641557, type: 'district', fullName: 'District 12, Ho Chi Minh City', vietnameseName: 'Quận 12' },
    'binh thanh': { lat: 10.803993, lng: 106.695464, type: 'district', fullName: 'Binh Thanh District, Ho Chi Minh City', vietnameseName: 'Quận Bình Thạnh' },
    'tan binh': { lat: 10.796291, lng: 106.668117, type: 'district', fullName: 'Tan Binh District, Ho Chi Minh City', vietnameseName: 'Quận Tân Bình' },
    'tan phu': { lat: 10.791757, lng: 106.627304, type: 'district', fullName: 'Tan Phu District, Ho Chi Minh City', vietnameseName: 'Quận Tân Phú' },
    'go vap': { lat: 10.839551, lng: 106.671028, type: 'district', fullName: 'Go Vap District, Ho Chi Minh City', vietnameseName: 'Quận Gò Vấp' },
    'phu nhuan': { lat: 10.799148, lng: 106.677320, type: 'district', fullName: 'Phu Nhuan District, Ho Chi Minh City', vietnameseName: 'Quận Phú Nhuận' },
    'thu duc': { lat: 10.852057, lng: 106.753987, type: 'district', fullName: 'Thu Duc City, Ho Chi Minh City', vietnameseName: 'Thành phố Thủ Đức' },

    // Major Streets and Roads in HCMC
    'nguyen hue': { lat: 10.774800, lng: 106.703500, type: 'street', fullName: 'Nguyen Hue Street, District 1', vietnameseName: 'Đường Nguyễn Huệ' },
    'le loi': { lat: 10.773200, lng: 106.698700, type: 'street', fullName: 'Le Loi Street, District 1', vietnameseName: 'Đường Lê Lợi' },
    'dong khoi': { lat: 10.777300, lng: 106.703100, type: 'street', fullName: 'Dong Khoi Street, District 1', vietnameseName: 'Đường Đồng Khởi' },
    'tran hung dao': { lat: 10.759600, lng: 106.688200, type: 'street', fullName: 'Tran Hung Dao Street, District 1', vietnameseName: 'Đường Trần Hưng Đạo' },
    'ly thai to': { lat: 10.782500, lng: 106.696300, type: 'street', fullName: 'Ly Thai To Street, District 3', vietnameseName: 'Đường Lý Thái Tổ' },
    'ba thang hai': { lat: 10.771500, lng: 106.667800, type: 'street', fullName: 'Ba Thang Hai Street, District 10', vietnameseName: 'Đường Ba Tháng Hai' },
    'su van hanh': { lat: 10.771800, lng: 106.669200, type: 'street', fullName: 'Su Van Hanh Street, District 10', vietnameseName: 'Đường Sư Vạn Hạnh' },
    'cong hoa': { lat: 10.797200, lng: 106.655600, type: 'street', fullName: 'Cong Hoa Street, Tan Binh', vietnameseName: 'Đường Cộng Hòa' },
    'nguyen thi minh khai': { lat: 10.787400, lng: 106.690500, type: 'street', fullName: 'Nguyen Thi Minh Khai Street, District 3', vietnameseName: 'Đường Nguyễn Thị Minh Khai' },
    'ham nghi': { lat: 10.771900, lng: 106.700200, type: 'street', fullName: 'Ham Nghi Street, District 1', vietnameseName: 'Đường Hàm Nghi' },
    'vo van tan': { lat: 10.782700, lng: 106.691200, type: 'street', fullName: 'Vo Van Tan Street, District 3', vietnameseName: 'Đường Võ Văn Tần' },
    'nam ky khoi nghia': { lat: 10.785600, lng: 106.698800, type: 'street', fullName: 'Nam Ky Khoi Nghia Street, District 1', vietnameseName: 'Đường Nam Kỳ Khởi Nghĩa' },
    'truong dinh': { lat: 10.781400, lng: 106.687500, type: 'street', fullName: 'Truong Dinh Street, District 3', vietnameseName: 'Đường Trương Định' },
    'dien bien phu': { lat: 10.797100, lng: 106.706700, type: 'street', fullName: 'Dien Bien Phu Street, Binh Thanh', vietnameseName: 'Đường Điện Biên Phủ' },
    'nguyen du': { lat: 10.779600, lng: 106.697800, type: 'street', fullName: 'Nguyen Du Street, District 1', vietnameseName: 'Đường Nguyễn Du' },
    'vo thi sau': { lat: 10.788900, lng: 106.690100, type: 'street', fullName: 'Vo Thi Sau Street, District 3', vietnameseName: 'Đường Võ Thị Sáu' },
    'cao thang': { lat: 10.783900, lng: 106.684700, type: 'street', fullName: 'Cao Thang Street, District 3', vietnameseName: 'Đường Cao Thắng' },
    'bach dang': { lat: 10.802400, lng: 106.711800, type: 'street', fullName: 'Bach Dang Street, Binh Thanh', vietnameseName: 'Đường Bạch Đằng' },
    'ton duc thang': { lat: 10.780800, lng: 106.706200, type: 'street', fullName: 'Ton Duc Thang Street, District 1', vietnameseName: 'Đường Tôn Đức Thắng' },
    'hai ba trung': { lat: 10.789200, lng: 106.696400, type: 'street', fullName: 'Hai Ba Trung Street, District 1', vietnameseName: 'Đường Hai Bà Trưng' },
    'pasteur': { lat: 10.785300, lng: 106.697900, type: 'street', fullName: 'Pasteur Street, District 1', vietnameseName: 'Đường Pasteur' },
    'le thanh ton': { lat: 10.781900, lng: 106.702300, type: 'street', fullName: 'Le Thanh Ton Street, District 1', vietnameseName: 'Đường Lê Thánh Tôn' },
    'mac thi buoi': { lat: 10.778900, lng: 106.701500, type: 'street', fullName: 'Mac Thi Buoi Street, District 1', vietnameseName: 'Đường Mạc Thị Bưởi' },
    'nguyen an ninh': { lat: 10.771600, lng: 106.697600, type: 'street', fullName: 'Nguyen An Ninh Street, District 1', vietnameseName: 'Đường Nguyễn An Ninh' },
    'le van sy': { lat: 10.798400, lng: 106.672100, type: 'street', fullName: 'Le Van Sy Street, Phu Nhuan', vietnameseName: 'Đường Lê Văn Sỹ' },
    'phan xich long': { lat: 10.802600, lng: 106.683700, type: 'street', fullName: 'Phan Xich Long Street, Phu Nhuan', vietnameseName: 'Đường Phan Xích Long' },
    'cmt8': { lat: 10.785100, lng: 106.672300, type: 'street', fullName: 'Cach Mang Thang Tam Street, District 3', vietnameseName: 'Đường Cách Mạng Tháng Tám' },
    'cach mang thang tam': { lat: 10.785100, lng: 106.672300, type: 'street', fullName: 'Cach Mang Thang Tam Street, District 3', vietnameseName: 'Đường Cách Mạng Tháng Tám' },
    'nguyen dinh chieu': { lat: 10.786900, lng: 106.689400, type: 'street', fullName: 'Nguyen Dinh Chieu Street, District 3', vietnameseName: 'Đường Nguyễn Đình Chiểu' },
    'vo van kiet': { lat: 10.747200, lng: 106.696800, type: 'street', fullName: 'Vo Van Kiet Boulevard, District 1', vietnameseName: 'Đại lộ Võ Văn Kiệt' },
    'nguyen trai': { lat: 10.756100, lng: 106.670400, type: 'street', fullName: 'Nguyen Trai Street, District 5', vietnameseName: 'Đường Nguyễn Trãi' },
    'tran phu': { lat: 10.754600, lng: 106.664800, type: 'street', fullName: 'Tran Phu Street, District 5', vietnameseName: 'Đường Trần Phú' },
    'an duong vuong': { lat: 10.753200, lng: 106.650100, type: 'street', fullName: 'An Duong Vuong Street, District 5', vietnameseName: 'Đường An Dương Vương' },
    'pham ngu lao': { lat: 10.768100, lng: 106.693200, type: 'street', fullName: 'Pham Ngu Lao Street, District 1', vietnameseName: 'Đường Phạm Ngũ Lão' },
    'de tham': { lat: 10.767800, lng: 106.692900, type: 'street', fullName: 'De Tham Street, District 1', vietnameseName: 'Đường Đề Thám' },
    'bui vien': { lat: 10.767400, lng: 106.693100, type: 'street', fullName: 'Bui Vien Street, District 1', vietnameseName: 'Đường Bùi Viện' },
    'xuan thuy': { lat: 10.804300, lng: 106.735600, type: 'street', fullName: 'Xuan Thuy Street, Thu Duc', vietnameseName: 'Đường Xuân Thủy' },
    'vo nguyen giap': { lat: 10.841900, lng: 106.805400, type: 'street', fullName: 'Vo Nguyen Giap Street, Thu Duc', vietnameseName: 'Đường Võ Nguyên Giáp' },
    'nguyen van linh': { lat: 10.727800, lng: 106.705300, type: 'street', fullName: 'Nguyen Van Linh Parkway, District 7', vietnameseName: 'Đường Nguyễn Văn Linh' },
    'nguyen huu tho': { lat: 10.727600, lng: 106.697800, type: 'street', fullName: 'Nguyen Huu Tho Street, District 7', vietnameseName: 'Đường Nguyễn Hữu Thọ' },
    'hoang sa': { lat: 10.799600, lng: 106.709100, type: 'street', fullName: 'Hoang Sa Street, Binh Thanh', vietnameseName: 'Đường Hoàng Sa' },
    'truong sa': { lat: 10.800100, lng: 106.708400, type: 'street', fullName: 'Truong Sa Street, Binh Thanh', vietnameseName: 'Đường Trường Sa' },

    // Major Highways and Expressways
    'highway 1a': { lat: 10.805600, lng: 106.695500, type: 'highway', fullName: 'National Highway 1A', vietnameseName: 'Quốc lộ 1A' },
    'ring road 2': { lat: 10.793500, lng: 106.656700, type: 'highway', fullName: 'Ring Road 2 (Vo Van Kiet)', vietnameseName: 'Đường Vành đai 2' },
    'east west highway': { lat: 10.747500, lng: 106.696900, type: 'highway', fullName: 'East-West Highway', vietnameseName: 'Đường Đông Tây' },
    'saigon bridge': { lat: 10.799700, lng: 106.717300, type: 'bridge', fullName: 'Saigon Bridge', vietnameseName: 'Cầu Sài Gòn' },
    'thu thiem bridge': { lat: 10.784600, lng: 106.717600, type: 'bridge', fullName: 'Thu Thiem Bridge', vietnameseName: 'Cầu Thủ Thiêm' },
    'phu my bridge': { lat: 10.741900, lng: 106.737500, type: 'bridge', fullName: 'Phu My Bridge', vietnameseName: 'Cầu Phú Mỹ' },

    // Popular Landmarks and Areas
    'ben thanh market': { lat: 10.772465, lng: 106.698087, type: 'landmark', fullName: 'Ben Thanh Market, District 1', vietnameseName: 'Chợ Bến Thành' },
    'reunification palace': { lat: 10.774974, lng: 106.695226, type: 'landmark', fullName: 'Reunification Palace, District 1', vietnameseName: 'Dinh Độc Lập' },
    'independence palace': { lat: 10.774974, lng: 106.695226, type: 'landmark', fullName: 'Independence Palace, District 1', vietnameseName: 'Dinh Độc Lập' },
    'notre dame cathedral': { lat: 10.779739, lng: 106.699037, type: 'landmark', fullName: 'Notre Dame Cathedral, District 1', vietnameseName: 'Nhà thờ Đức Bà' },
    'central post office': { lat: 10.780013, lng: 106.699987, type: 'landmark', fullName: 'Central Post Office, District 1', vietnameseName: 'Bưu điện Trung tâm Sài Gòn' },
    'bitexco tower': { lat: 10.771650, lng: 106.704605, type: 'landmark', fullName: 'Bitexco Financial Tower, District 1', vietnameseName: 'Tháp Bitexco' },
    'landmark 81': { lat: 10.794963, lng: 106.721948, type: 'landmark', fullName: 'Landmark 81, Binh Thanh District', vietnameseName: 'Landmark 81' },
    'ho chi minh city hall': { lat: 10.776645, lng: 106.701769, type: 'landmark', fullName: 'Ho Chi Minh City Hall, District 1', vietnameseName: 'Ủy ban Nhân dân Thành phố Hồ Chí Minh' },
    'war remnants museum': { lat: 10.779446, lng: 106.692171, type: 'landmark', fullName: 'War Remnants Museum, District 3', vietnameseName: 'Bảo tàng Chứng tích Chiến tranh' },
    'jade emperor pagoda': { lat: 10.791146, lng: 106.698276, type: 'landmark', fullName: 'Jade Emperor Pagoda, District 1', vietnameseName: 'Chùa Ngọc Hoàng' },
    'cao dai temple': { lat: 10.783400, lng: 106.668900, type: 'landmark', fullName: 'Cao Dai Temple, District 5', vietnameseName: 'Thánh thất Cao Đài' },
    'giac lam pagoda': { lat: 10.785600, lng: 106.618200, type: 'landmark', fullName: 'Giac Lam Pagoda, Tan Phu District', vietnameseName: 'Chùa Giác Lâm' },
    'tan son nhat airport': { lat: 10.818800, lng: 106.651900, type: 'landmark', fullName: 'Tan Son Nhat International Airport', vietnameseName: 'Sân bay Quốc tế Tân Sơn Nhất' },
    'saigon skydeck': { lat: 10.771650, lng: 106.704605, type: 'landmark', fullName: 'Saigon Skydeck, Bitexco Tower', vietnameseName: 'Saigon Skydeck' },
    'diamond plaza': { lat: 10.781200, lng: 106.699800, type: 'landmark', fullName: 'Diamond Plaza, District 1', vietnameseName: 'Diamond Plaza' },
    'vincom center': { lat: 10.778200, lng: 106.702100, type: 'landmark', fullName: 'Vincom Center, District 1', vietnameseName: 'Vincom Center' },
    'takashimaya': { lat: 10.773100, lng: 106.700900, type: 'landmark', fullName: 'Takashimaya Department Store, District 1', vietnameseName: 'Takashimaya' },
    'saigon centre': { lat: 10.773100, lng: 106.700900, type: 'landmark', fullName: 'Saigon Centre, District 1', vietnameseName: 'Saigon Centre' },

    // Universities and Schools
    'university of economics': { lat: 10.771600, lng: 106.688100, type: 'university', fullName: 'University of Economics Ho Chi Minh City', vietnameseName: 'Đại học Kinh tế TP.HCM' },
    'rmit university': { lat: 10.729600, lng: 106.695100, type: 'university', fullName: 'RMIT University Vietnam, District 7', vietnameseName: 'Đại học RMIT Việt Nam' },
    'ton duc thang university': { lat: 10.742200, lng: 106.703100, type: 'university', fullName: 'Ton Duc Thang University, District 7', vietnameseName: 'Đại học Tôn Đức Thắng' },
    'banking university': { lat: 10.849600, lng: 106.771200, type: 'university', fullName: 'Banking University of Ho Chi Minh City', vietnameseName: 'Đại học Ngân hàng TP.HCM' },

    // Parks and Recreation
    'tao dan park': { lat: 10.771200, lng: 106.690300, type: 'park', fullName: 'Tao Dan Park, District 1', vietnameseName: 'Công viên Tao Đàn' },
    'le van tam park': { lat: 10.788100, lng: 106.696800, type: 'park', fullName: 'Le Van Tam Park, District 1', vietnameseName: 'Công viên Lê Văn Tám' },
    'september 23 park': { lat: 10.768600, lng: 106.695400, type: 'park', fullName: 'September 23 Park, District 1', vietnameseName: 'Công viên 23/9' },
    'van thanh park': { lat: 10.802900, lng: 106.715600, type: 'park', fullName: 'Van Thanh Park, Binh Thanh', vietnameseName: 'Công viên Văn Thánh' },
    'gia dinh park': { lat: 10.821400, lng: 106.672800, type: 'park', fullName: 'Gia Dinh Park, Go Vap', vietnameseName: 'Công viên Gia Định' },

    // Markets and Commercial Areas
    'saigon square': { lat: 10.773500, lng: 106.700400, type: 'market', fullName: 'Saigon Square, District 1', vietnameseName: 'Saigon Square' },
    'russian market': { lat: 10.793100, lng: 106.686200, type: 'market', fullName: 'Russian Market, District 1', vietnameseName: 'Chợ Nga' },
    'cho lon': { lat: 10.749600, lng: 106.652300, type: 'area', fullName: 'Cho Lon (Chinatown), District 5', vietnameseName: 'Chợ Lớn' },
    'chinatown': { lat: 10.749600, lng: 106.652300, type: 'area', fullName: 'Chinatown (Cho Lon), District 5', vietnameseName: 'Chợ Lớn' },
    'japanese town': { lat: 10.781900, lng: 106.701800, type: 'area', fullName: 'Japanese Town, District 1', vietnameseName: 'Khu phố Nhật' },
    'korean town': { lat: 10.791200, lng: 106.665400, type: 'area', fullName: 'Korean Town, Tan Binh', vietnameseName: 'Khu phố Hàn' },

    // Transportation Hubs
    'ben xe mien dong': { lat: 10.816400, lng: 106.720900, type: 'transport', fullName: 'Mien Dong Bus Station, Binh Thanh', vietnameseName: 'Bến xe Miền Đông' },
    'ben xe mien tay': { lat: 10.740300, lng: 106.616600, type: 'transport', fullName: 'Mien Tay Bus Station, Binh Tan', vietnameseName: 'Bến xe Miền Tây' },
    'saigon railway station': { lat: 10.781800, lng: 106.676900, type: 'transport', fullName: 'Saigon Railway Station, District 3', vietnameseName: 'Ga Sài Gòn' },
    'cat lai port': { lat: 10.776300, lng: 106.791600, type: 'transport', fullName: 'Cat Lai Port, District 2', vietnameseName: 'Cảng Cát Lái' },

    // Hospitals and Medical Centers
    'cho ray hospital': { lat: 10.756300, lng: 106.661400, type: 'hospital', fullName: 'Cho Ray Hospital, District 5', vietnameseName: 'Bệnh viện Chợ Rẫy' },
    'university medical center': { lat: 10.756600, lng: 106.661900, type: 'hospital', fullName: 'University Medical Center, District 5', vietnameseName: 'Bệnh viện Đại học Y Dược' },
    'fv hospital': { lat: 10.732600, lng: 106.699800, type: 'hospital', fullName: 'FV Hospital, District 7', vietnameseName: 'Bệnh viện FV' },
    'international hospital': { lat: 10.791400, lng: 106.693200, type: 'hospital', fullName: 'International Hospital, District 3', vietnameseName: 'Bệnh viện Quốc tế' },

    // Popular Areas and Neighborhoods
    'pham ngu lao': { lat: 10.768100, lng: 106.693200, type: 'area', fullName: 'Pham Ngu Lao Backpacker Area, District 1', vietnameseName: 'Khu Phạm Ngũ Lão' },
    'bui vien': { lat: 10.767400, lng: 106.693100, type: 'street', fullName: 'Bui Vien Street (Backpacker Street), District 1', vietnameseName: 'Đường Bùi Viện' },
    'thao dien': { lat: 10.804700, lng: 106.734500, type: 'area', fullName: 'Thao Dien, District 2', vietnameseName: 'Thảo Điền' },
    'an phu': { lat: 10.801900, lng: 106.737800, type: 'area', fullName: 'An Phu, District 2', vietnameseName: 'An Phú' },
    'phu my hung': { lat: 10.730100, lng: 106.700200, type: 'area', fullName: 'Phu My Hung, District 7', vietnameseName: 'Phú Mỹ Hưng' },
    'crescent mall': { lat: 10.729900, lng: 106.698400, type: 'landmark', fullName: 'Crescent Mall, District 7', vietnameseName: 'Crescent Mall' },

    // Common abbreviations and alternative names
    'q1': { lat: 10.774389, lng: 106.699172, type: 'district', fullName: 'District 1 (Q1), Ho Chi Minh City', vietnameseName: 'Quận 1' },
    'q3': { lat: 10.783139, lng: 106.686991, type: 'district', fullName: 'District 3 (Q3), Ho Chi Minh City', vietnameseName: 'Quận 3' },
    'bt': { lat: 10.803993, lng: 106.695464, type: 'district', fullName: 'Binh Thanh District (BT), Ho Chi Minh City', vietnameseName: 'Quận Bình Thạnh' },
    'tb': { lat: 10.796291, lng: 106.668117, type: 'district', fullName: 'Tan Binh District (TB), Ho Chi Minh City', vietnameseName: 'Quận Tân Bình' },
    'hcmc': { lat: 10.774389, lng: 106.699172, type: 'city', fullName: 'Ho Chi Minh City (HCMC)', vietnameseName: 'Thành phố Hồ Chí Minh' },
    'saigon': { lat: 10.774389, lng: 106.699172, type: 'city', fullName: 'Saigon (Ho Chi Minh City)', vietnameseName: 'Sài Gòn' },
    'tp hcm': { lat: 10.774389, lng: 106.699172, type: 'city', fullName: 'TP Ho Chi Minh (Ho Chi Minh City)', vietnameseName: 'TP Hồ Chí Minh' },

    // Common intersections
    'nga tu ben thanh': { lat: 10.772465, lng: 106.698087, type: 'intersection', fullName: 'Ben Thanh Market Intersection', vietnameseName: 'Ngã tư Bến Thành' },
    'nga tu hang xanh': { lat: 10.801900, lng: 106.711600, type: 'intersection', fullName: 'Hang Xanh Intersection, Binh Thanh', vietnameseName: 'Ngã tư Hàng Xanh' },
    'nga sau cong hoa': { lat: 10.797200, lng: 106.655600, type: 'intersection', fullName: 'Cong Hoa Six-way Intersection', vietnameseName: 'Ngã sáu Cộng Hòa' },
    'nga ba dien bien phu': { lat: 10.797100, lng: 106.706700, type: 'intersection', fullName: 'Dien Bien Phu Three-way Intersection', vietnameseName: 'Ngã ba Điện Biên Phủ' }
};

// Enhanced search function with support for Vietnamese diacritics
function searchPlaces(query) {
    const searchTerm = normalizeVietnamese(query).trim();
    const results = [];

    // Score-based matching for better relevance
    Object.keys(vietnamPlaces).forEach(place => {
        const placeData = vietnamPlaces[place];
        const normalizedPlace = normalizeVietnamese(place);
        const normalizedVietnameseName = placeData.vietnameseName ? normalizeVietnamese(placeData.vietnameseName) : '';
        let score = 0;
        let matchType = '';

        // Exact match (highest score)
        if (normalizedPlace === searchTerm || normalizedVietnameseName === searchTerm) {
            score = 100;
            matchType = 'exact';
        }
        // Starts with query (high score)
        else if (normalizedPlace.startsWith(searchTerm) || normalizedVietnameseName.startsWith(searchTerm)) {
            score = 80;
            matchType = 'prefix';
        }
        // Contains all words from query (medium score)
        else if (containsAllWords(normalizedPlace, searchTerm) || containsAllWords(normalizedVietnameseName, searchTerm)) {
            score = 60;
            matchType = 'all-words';
        }
        // Contains any word from query (lower score)
        else if (containsAnyWord(normalizedPlace, searchTerm) || containsAnyWord(normalizedVietnameseName, searchTerm)) {
            score = 40;
            matchType = 'partial';
        }
        // Similar/fuzzy match (lowest score)
        else if (isSimilar(normalizedPlace, searchTerm) || isSimilar(normalizedVietnameseName, searchTerm)) {
            score = 20;
            matchType = 'similar';
        }

        if (score > 0) {
            results.push({
                name: place,
                displayName: placeData.vietnameseName || placeData.fullName || place,
                lat: placeData.lat,
                lng: placeData.lng,
                type: placeData.type,
                score: score,
                matchType: matchType,
                vietnameseName: placeData.vietnameseName
            });
        }
    });

    // Sort by score (highest first), then by name length (shorter first)
    results.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.name.length - b.name.length;
    });

    return results;
}

// Helper functions for matching
function containsAllWords(text, query) {
    if (!text || !query) return false;
    const queryWords = query.split(' ').filter(word => word.length > 0);
    return queryWords.every(word => text.includes(word));
}

function containsAnyWord(text, query) {
    if (!text || !query) return false;
    const queryWords = query.split(' ').filter(word => word.length > 1); // Only consider words > 1 char
    return queryWords.some(word => text.includes(word));
}

function isSimilar(text, query) {
    if (!text || !query) return false;
    const similarity = calculateSimilarity(text, query);
    return similarity > 0.6; // 60% similarity threshold
}

function calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[str2.length][str1.length];
}

// Main search endpoint
router.get('/', (req, res) => {
    const query = req.query.query;

    if (!query) {
        return res.status(400).json({
            success: false,
            message: 'No search query provided'
        });
    }

    console.log('Search query:', query);

    // Search in our enhanced HCMC database
    const results = searchPlaces(query);

    // Limit results to top 10
    const limitedResults = results.slice(0, 10);

    if (limitedResults.length > 0) {
        res.json({
            success: true,
            message: `Found ${limitedResults.length} result(s) for: ${query}`,
            results: limitedResults,
            searchTerm: query,
            useGeocoding: false // Our database has results, don't use geocoding
        });
    } else {
        // Fallback to Google Maps geocoding for places not in our database
        res.json({
            success: true,
            message: `No local results found for "${query}". Trying Google Maps geocoding...`,
            results: [],
            useGeocoding: true,
            searchTerm: query
        });
    }
});

// Enhanced suggestions endpoint for autocomplete
router.get('/suggestions', (req, res) => {
    const query = req.query.q;

    if (!query || query.length < 1) {
        return res.json({ success: true, suggestions: [] });
    }

    const searchTerm = query.trim();
    const suggestions = [];

    // Get all matching places with scores
    const matches = searchPlaces(searchTerm);

    // Convert to suggestion format
    matches.slice(0, 8).forEach(match => { // Limit to 8 suggestions
        suggestions.push({
            name: match.name,
            displayName: match.vietnameseName || match.displayName,
            type: match.type,
            score: match.score,
            matchType: match.matchType,
            vietnameseName: match.vietnameseName
        });
    });

    res.json({
        success: true,
        suggestions: suggestions,
        query: query
    });
});

// Additional endpoint for getting place details
router.get('/place/:placeName', (req, res) => {
    const placeName = normalizeVietnamese(req.params.placeName);
    let place = null;

    // Search for place by normalized name or Vietnamese name
    Object.keys(vietnamPlaces).forEach(key => {
        const normalizedKey = normalizeVietnamese(key);
        const normalizedVietnameseName = vietnamPlaces[key].vietnameseName ? normalizeVietnamese(vietnamPlaces[key].vietnameseName) : '';
        if (normalizedKey === placeName || normalizedVietnameseName === placeName) {
            place = vietnamPlaces[key];
            place.name = key;
        }
    });

    if (place) {
        res.json({
            success: true,
            place: {
                name: place.name,
                displayName: place.vietnameseName || place.fullName || place.name,
                lat: place.lat,
                lng: place.lng,
                type: place.type,
                vietnameseName: place.vietnameseName
            }
        });
    } else {
        res.status(404).json({
            success: false,
            message: 'Place not found'
        });
    }
});

module.exports = router;