import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import auctionService from '../../services/api/auction.service';

export interface AuctionProduct {
  id: string;
  name: string;
  slug: string;
  thumbnail: string | null;
  price: string;
  salePrice: string | null;
}

export interface AuctionItem {
  id: string;
  productId: string;
  startingPrice: string;
  currentHighestBid: string | null;
  totalBids: number;
  quantity: number;
  category: string;
  auctionDate: string;
  startsAt: string;
  endsAt: string;
  status: string;
  winnerId: string | null;
  product: AuctionProduct;
}

interface AuctionState {
  todayItems: AuctionItem[];
  selected: AuctionItem | null;
  myBids: any[];
  loading: boolean;
  error: string | null;
}

const initialState: AuctionState = {
  todayItems: [],
  selected: null,
  myBids: [],
  loading: false,
  error: null,
};

export const fetchTodayAuctions = createAsyncThunk('auction/today', async () => {
  const res = await auctionService.getTodayAuctions();
  return res.data;
});

export const fetchAuctionById = createAsyncThunk('auction/byId', async (id: string) => {
  const res = await auctionService.getAuctionItem(id);
  return res.data;
});

export const placeBid = createAsyncThunk(
  'auction/placeBid',
  async (payload: { auctionItemId: string; bidPrice: number; bidQuantity: number }, { rejectWithValue }) => {
    try {
      const res = await auctionService.placeBid(payload);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Teklif gönderilemedi');
    }
  },
);

export const fetchMyBids = createAsyncThunk('auction/myBids', async (page: number = 1) => {
  const res = await auctionService.getMyBids(page);
  return res.data;
});

const auctionSlice = createSlice({
  name: 'auction',
  initialState,
  reducers: {
    clearSelected(state) {
      state.selected = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchTodayAuctions.pending, (s) => {
      s.loading = true;
      s.error = null;
    })
      .addCase(fetchTodayAuctions.fulfilled, (s, a: any) => {
        s.loading = false;
        s.todayItems = a.payload?.data || [];
      })
      .addCase(fetchTodayAuctions.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message || 'Veri alınamadı';
      })
      .addCase(fetchAuctionById.fulfilled, (s, a: any) => {
        s.selected = a.payload?.data || null;
      })
      .addCase(fetchMyBids.fulfilled, (s, a: any) => {
        s.myBids = a.payload?.data || [];
      });
  },
});

export const { clearSelected } = auctionSlice.actions;
export default auctionSlice.reducer;
